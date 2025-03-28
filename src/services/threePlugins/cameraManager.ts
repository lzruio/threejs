import { Module } from '@/types/module'
import { ThreeService } from '@/services/ThreeService'
import type { IPluginTemplate } from './IPlugin'
import log from '@/utils/log'
import { Box3, Vector3, Matrix4 } from 'three'
import { getMaxValue, Vector4 } from '@/utils/math'
import gsap from 'gsap'
import { throttle } from 'lodash'
// 相机视角方向
export enum CameraDirection {
  FRONT = 'front',
  TOP = 'top',
  SIDE = 'side',
  AUTO = 'auto',
}

// 相机管理插件
class CameraManager implements IPluginTemplate {
  static pluginName = 'CameraManager'
  static events: string[] = ['cameraZoom']
  static apis: string[] = []

  app: ThreeService

  // 相机距离控制参数
  private baseDistance: number = 1000 // 基准观察距离（对应滑块值50）
  private distanceRatio: number = 5 // 最大/最小距离比例
  private minDistance: number = this.baseDistance / this.distanceRatio // 最小观察距离
  private maxDistance: number = this.baseDistance * this.distanceRatio // 最大观察距离

  // 自动调整时相机相对于场景的相对位置向量
  private autoAdjustCameraPos: Vector4 = new Vector4(-1, 1, 1, 1)

  constructor(app: ThreeService) {
    this.app = app
  }
  public mounted() {
    try {
      if (!this.app.control) {
        log.error('相机控制器未初始化!')
        return
      }
      this.app.control.addEventListener('change', this.changeHandler)
    } catch (error) {
      log.error('监听相机控制器失败', error)
      throw error
    }
  }
  // 钩子函数
  public modelLoadAfter() {
    try {
      // 将基准值设置为自动调整后的距离
      const { position, target } = this.calcAdjustCameraTargetAndPos() || {}
      if (position && target) {
        const distance = position.distanceTo(target)
        this.updateBaseDistance(distance)
      }
    } catch (error) {
      log.error('更新基准距离失败', error)
      throw error
    }
  }

  // 设置自动调整时相机相对于场景的相对位置向量
  public setAutoAdjustCameraPos(pos: Vector4) {
    this.autoAdjustCameraPos = pos
  }

  // 放缩事件
  private throttledEmit = throttle((value: number) => {
    this.app.emit('cameraZoom', value)
  }, 16)
  public changeHandler = () => {
    // 使用节流限制事件触发频率
    const sliderValue = this.getCurrentZoomAsSliderValue()
    this.throttledEmit(sliderValue)
  }

  public dispose() {
    // 卸载事件
    this.app.control?.removeEventListener('change', this.changeHandler)
  }

  // 更新基准距离
  public updateBaseDistance(value: number) {
    this.baseDistance = value
    this.minDistance = this.baseDistance / this.distanceRatio
    this.maxDistance = this.baseDistance * this.distanceRatio
  }

  // 根据滑块值设置相机距离 (value: 0-100)
  public setZoomBySlider(value: number) {
    const { camera, control } = this.app
    if (!camera || !control) return

    // 将滑块值反向映射到距离，使baseDistance对应滑块值50
    const normalizedValue = (50 - value) / 50 // 将0-100映射为1到-1（注意这里改为50-value）
    const targetDistance =
      this.baseDistance * Math.pow(this.maxDistance / this.minDistance, normalizedValue)

    // 获取从相机位置到目标点的方向向量
    const direction = camera.position.clone().sub(control.target).normalize()

    // 计算新的相机位置
    const newPosition = control.target.clone().add(direction.multiplyScalar(targetDistance))

    // 更新相机位置
    camera.position.copy(newPosition)
    camera.updateProjectionMatrix()
    control.update()
  }

  // 获取当前缩放值对应的滑块值 (返回0-100)
  public getCurrentZoomAsSliderValue(): number {
    if (!this.app.camera || !this.app.control) return 50 // 默认返回中间值

    // 计算当前距离
    const currentDistance = this.app.camera.position.distanceTo(this.app.control.target)

    // 将当前距离映射回滑块值
    const normalizedValue =
      Math.log(currentDistance / this.baseDistance) / Math.log(this.maxDistance / this.minDistance)
    const sliderValue = 50 - normalizedValue * 50 // 反转映射关系

    return Math.max(0, Math.min(100, sliderValue))
  }

  // 调整相机（包含整个场景）
  public adjustCamera(isAnimate: boolean = true) {
    if (isAnimate) {
      this.adjustCameraAnimate()
    } else {
      this.adjustCameraImmediately()
    }
  }
  // 调整相机到俯视图
  public adjustCameraToTopView(isAnimate: boolean = true) {
    if (isAnimate) {
      this.adjustCameraToTopViewAnimate()
    } else {
      this.adjustCameraToTopViewImmediately()
    }
  }

  // 调整为正视相机
  public adjustCameraToFrontView(isAnimate: boolean = true) {
    if (isAnimate) {
      this.adjustCameraToFrontViewAnimate()
    } else {
      this.adjustCameraToFrontViewImmediately()
    }
  }
  // 调整为侧视相机
  public adjustCameraToSideView(isAnimate: boolean = true) {
    if (isAnimate) {
      this.adjustCameraToSideViewAnimate()
    } else {
      this.adjustCameraToSideViewImmediately()
    }
  }

  // 调整相机（立即）
  public adjustCameraImmediately() {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return
    const { target, position } = this.calcAdjustCameraTargetAndPos() || {}
    if (!target || !position) return

    camera.position.copy(position)
    camera.lookAt(target)
    // this.camera.near = max * 0.1
    // this.camera.far = max * 300

    camera.updateProjectionMatrix()
    control.target.copy(target)
    control.update()
  }

  // 调整相机（动画）
  public adjustCameraAnimate() {
    const { camera, control } = this.app
    if (!camera || !control) return
    const { target, position } = this.calcAdjustCameraTargetAndPos() || {}
    if (!target || !position) return
    if (target.x === position.x && target.y === position.y && target.z === position.z) {
      return
    }
    // 使用 GSAP 创建相机位置的动画
    gsap.to(camera.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration: 1,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(target)

        camera.updateProjectionMatrix()
      },
    })

    // 使用 GSAP 创建控制器目标点的动画
    gsap.to(control.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 1,
      ease: 'power2.inOut',
      onUpdate: () => {
        control.update()
      },
    })
  }

  // 计算自动调整后相机目标点和位置
  public calcAdjustCameraTargetAndPos() {
    const { box, zAngleAver } = this.getSceneBoxAndAveZRotation() || {}
    if (!box || !zAngleAver) return

    const center = box.getCenter(new Vector3())
    const size = box.getSize(new Vector3())
    const max = getMaxValue([size.x, size.y, size.z])

    const position = this.getFrontPosition(center, max, zAngleAver)

    return {
      target: center,
      position: position,
    }
  }

  // 获取正面的左上角位置
  public getFrontPosition(center: Vector3, max: number, rotate: number): Vector3 {
    // 基准位置
    const basePos = new Vector4(max * 0.6, max * 1, max * 0.7, 1)
    // 加乘
    const truePos = basePos.mul(this.autoAdjustCameraPos)
    const offset = new Vector3(truePos.x, truePos.y, truePos.z)
    const rotationMatrix = new Matrix4().makeRotationZ(rotate)
    const rotatedOffset = offset.applyMatrix4(rotationMatrix)
    return center.clone().add(rotatedOffset)
  }

  //

  // 调整为正视相机(立即切换)
  public adjustCameraToFrontViewImmediately() {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return

    const targetPos = this.calcFrontViewPos()
    if (!targetPos) return

    // 将相机移动到目标点正上方，保持相同距离
    camera.position.set(targetPos.x, targetPos.y, targetPos.z)
    camera.updateProjectionMatrix()
    // 更新控制器
    control.update()
  }

  // 调整为正视相机(动画)
  public adjustCameraToFrontViewAnimate() {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return

    const targetPos = this.calcFrontViewPos()
    if (!targetPos) return

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1,
      onUpdate: () => {
        camera.lookAt(control.target)
        control.update()
      },
    })
  }

  public calcFrontViewPos() {
    const { camera, control } = this.app
    if (!camera || !control) return

    // 计算相机到目标点的距离（此方法会可能会突然x,y轴翻转）
    // const targetPoint = control.target.clone()
    // const distance = camera.position.distanceTo(targetPoint)
    // const targetPos = new Vector3(targetPoint.x, targetPoint.y + distance, targetPoint.z)

    const targetPoint = control.target.clone()
    const originPos = camera.position.clone()
    const distance = originPos.distanceTo(targetPoint)

    const currentXZ = new Vector3(
      camera.position.x - targetPoint.x,
      0,
      camera.position.z - targetPoint.z,
    ).normalize()

    // 判断当前相机位置是在目标点的哪一侧
    const targetPos = new Vector3(
      // 保持与当前位置相同的 x-y 方向
      targetPoint.x + currentXZ.x * (distance * 0.00001), // 保持一个很小的偏移以维持方向
      targetPoint.y - distance,
      targetPoint.z + currentXZ.z * (distance * 0.00001),
    )

    return targetPos
  }

  // 调整为俯视相机(立即切换)
  public adjustCameraToTopViewImmediately() {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return

    const targetPos = this.calcTopViewPos()
    if (!targetPos) return
    // 将相机移动到目标点正上方，保持相同距离
    camera.position.set(targetPos.x, targetPos.y, targetPos.z)
    // 更新控制器
    control.update()
  }

  public adjustCameraToTopViewAnimate() {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return

    const targetPos = this.calcTopViewPos()
    if (!targetPos) return

    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1,
      onUpdate: () => {
        camera.lookAt(control.target)
        control.update()
      },
    })
  }

  // 计算俯视图的相机位置
  public calcTopViewPos() {
    const { camera, control } = this.app
    if (!camera || !control) return

    const targetPoint = control.target.clone()
    const originPos = camera.position.clone()
    const distance = originPos.distanceTo(targetPoint)

    const currentXY = new Vector3(
      camera.position.x - targetPoint.x,
      camera.position.y - targetPoint.y,
      0,
    ).normalize()

    const targetPos = new Vector3(
      targetPoint.x + currentXY.x * (distance * 0.00001),
      targetPoint.y + currentXY.y * (distance * 0.00001),
      targetPoint.z + distance,
    )

    return targetPos
  }

  // 调整为侧视相机(立即切换)
  public adjustCameraToSideViewImmediately() {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return

    const targetPos = this.calcSideViewPos()
    if (!targetPos) return
    camera.position.set(targetPos.x, targetPos.y, targetPos.z)
    control.update()
  }
  public adjustCameraToSideViewAnimate() {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return

    const targetPos = this.calcSideViewPos()
    if (!targetPos) return
    gsap.to(camera.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 1,
      onUpdate: () => {
        camera.lookAt(control.target)
        control.update()
      },
    })
  }
  public calcSideViewPos() {
    const { camera, control } = this.app
    if (!camera || !control) return
    const targetPoint = control.target.clone()
    const originPos = camera.position.clone()
    const distance = originPos.distanceTo(targetPoint)

    const currentXY = new Vector3(
      0,
      camera.position.y - targetPoint.y,
      camera.position.z - targetPoint.z,
    ).normalize()

    const targetPos = new Vector3(
      targetPoint.x - distance,
      targetPoint.y + currentXY.y * (distance * 0.00001),
      targetPoint.z + currentXY.z * (distance * 0.00001),
    )

    return targetPos
  }

  // 相机聚集到板件
  public adjustCameraToBoard(boardId: string, isAnimate: boolean = true) {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return false

    if (isAnimate) {
      return this.adjustCameraToBoardAnimate(boardId)
    } else {
      return this.adjustCameraToBoardImmediately(boardId)
    }
  }

  // 相机聚集到板件
  public adjustCameraToBoardImmediately(boardId: string) {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return false

    const { target, position } = this.calcBoardPos(boardId) || {}
    if (!target || !position) return false

    camera.position.copy(position)
    camera.lookAt(target)
    // this.camera.near = max * 0.1
    // this.camera.far = max * 300

    camera.updateProjectionMatrix()
    control.target.copy(target)
    control.update()
    return true
  }

  // 相机聚集到板件(动画)
  public adjustCameraToBoardAnimate(boardId: string) {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return false

    const { target, position } = this.calcBoardPos(boardId) || {}
    if (!target || !position) return false

    gsap.to(camera.position, {
      x: position.x,
      y: position.y,
      z: position.z,
      duration: 1,
      ease: 'power2.inOut',
      onUpdate: () => {
        camera.lookAt(target)
        control.update()
      },
    })

    gsap.to(control.target, {
      x: target.x,
      y: target.y,
      z: target.z,
      duration: 1,
      ease: 'power2.inOut',
      onUpdate: () => {
        control.update()
      },
    })
    return true
  }

  // 计算板件的相机位置
  public calcBoardPos(boardId: string) {
    const { scene, camera, control } = this.app
    if (!scene || !camera || !control) return

    const { box, zAngleAver } = this.getSceneBoxAndAveZRotation() || {}
    if (!box || !zAngleAver) return
    const size = box.getSize(new Vector3())
    const max = getMaxValue([size.x, size.y, size.z])

    // 基准位置
    const basePos = new Vector4(max * 0.6, max * 1, max * 0.7, 1)
    // 加乘
    const truePos = basePos.mul(this.autoAdjustCameraPos)
    const offset = new Vector3(truePos.x, truePos.y, truePos.z)
    const rotationMatrix = new Matrix4().makeRotationZ(zAngleAver)
    const rotatedOffset = offset.applyMatrix4(rotationMatrix)

    const boardGroup = scene.getObjectByName(boardId)
    if (!boardGroup) return
    const groupBox = new Box3().setFromObject(boardGroup)
    const center = groupBox.getCenter(new Vector3())
    const pos = center.clone().add(offset)

    return {
      target: center,
      position: pos,
    }
  }

  // 获取整个场景的包围盒，以及场景的平均旋转角度
  public getSceneBoxAndAveZRotation() {
    const { scene } = this.app
    if (!scene) return

    const children = scene.children.filter(
      (child) => child.type === 'Group' && child.userData.module,
    )
    if (children.length === 0) return

    const filteredChildren = children.filter((child) => child.children.length > 1)
    const zAngleAver =
      filteredChildren.length > 0
        ? filteredChildren.reduce((acc, child) => acc + child.rotation.z, 0) /
          filteredChildren.length
        : 0

    // 创建一个新的包围盒
    const boundingBox = new Box3()
    children.forEach((child) => {
      const childBox = new Box3().setFromObject(child)
      boundingBox.union(childBox)
    })

    return {
      box: boundingBox,
      zAngleAver: zAngleAver,
    }
  }
}

export { CameraManager }
