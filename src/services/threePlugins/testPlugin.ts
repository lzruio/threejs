import type { IPluginTemplate } from './IPlugin'
import { ThreeService } from '@/services/ThreeService'
import { Mesh, Color, Vector2, Vector3, Box3, MeshBasicMaterial } from 'three'
import { LineMaterial, LineSegmentsGeometry, LineSegments2, OutlinePass } from 'three/addons'
import { MeshType } from '@/types'
import log from '@/utils/log'
// 视图切换插件
export class TestPlugin implements IPluginTemplate {
  static pluginName = 'TestPlugin'
  static events: string[] = []
  static apis: string[] = []

  app: ThreeService

  // 高亮模型的颜色
  highLightColor: Color = new Color(0.764, 0.631, 0.443)

  // 高亮模型包围盒
  // private highLightBox: LineSegments2;

  private outlinePass: OutlinePass | null = null

  constructor(app: ThreeService) {
    this.app = app
  }

  // 挂载完成钩子
  public mounted() {
    // const color = new Color(1, 0, 0);
    // const linewidth = 4;
    // this.initHighLightBox(color, linewidth);
    this.initOutlinePass()
  }

  public initOutlinePass() {
    if (!this.app.composer) return
    if (!this.app.composer) return
    const outlinePass = new OutlinePass(
      new Vector2(window.innerWidth, window.innerHeight),
      this.app.scene!,
      this.app.camera!,
    )

    // 这里颜色空间为linear空间，需要转换为rgb空间
    // 放在renderPass之后
    // const gammaCorrectionShader = new ShaderPass(GammaCorrectionShader)
    // this.composer.addPass(gammaCorrectionShader)
    this.app.composer!.addPass(outlinePass)
    this.outlinePass = outlinePass
  }

  // 初始化自定义高亮框
  // public initHighLightBox(color: Color, linewidth: number) {
  //   // 创建线条材质
  //   const lineMaterial = new LineMaterial({
  //     color: color,
  //     linewidth: linewidth,
  //     transparent: true,
  //     depthTest: false,
  //     resolution: new Vector2(window.innerWidth, window.innerHeight),
  //   });

  //   // 创建线条几何体
  //   const geometry = new LineSegmentsGeometry();
  //   // 创建线条对象
  //   this.highLightBox = new LineSegments2(geometry, lineMaterial);
  //   this.highLightBox.visible = false;
  //   this.highLightBox.renderOrder = 10;
  //   this.app.scene?.add(this.highLightBox);
  // }

  private createBoxLines(box: Box3): Float32Array {
    const min = box.min
    const max = box.max
    // 定义8个顶点
    const vertices = [
      new Vector3(min.x, min.y, min.z), // 0
      new Vector3(max.x, min.y, min.z), // 1
      new Vector3(max.x, max.y, min.z), // 2
      new Vector3(min.x, max.y, min.z), // 3
      new Vector3(min.x, min.y, max.z), // 4
      new Vector3(max.x, min.y, max.z), // 5
      new Vector3(max.x, max.y, max.z), // 6
      new Vector3(min.x, max.y, max.z), // 7
    ]
    // 定义12条边的连接顺序
    // prettier-ignore
    // 定义12条边的连接顺序
    const indices = [
      0, 1, 1, 2, 2, 3, 3, 0, // 前面的四条边
      4, 5, 5, 6, 6, 7, 7, 4, // 后面的四条边
      0, 4, 1, 5, 2, 6, 3, 7, // 连接前后面的四条边
    ];
    // 创建位置数组
    const positions = new Float32Array(indices.length * 3)
    for (let i = 0; i < indices.length; i++) {
      const vertex = vertices[indices[i]]
      positions[i * 3] = vertex.x
      positions[i * 3 + 1] = vertex.y
      positions[i * 3 + 2] = vertex.z
    }
    return positions
  }

  // 高亮模型
  public highLightMesh(mesh: Mesh) {
    if (!this.outlinePass) return
    const material = mesh.material as MeshBasicMaterial
    material.color.set(this.highLightColor)
    material.opacity = 1
    // mesh.renderOrder = 10

    this.outlinePass.selectedObjects.push(mesh)
  }

  // 取消高亮
  public cancelHighLightMesh(mesh: Mesh) {
    if (!this.outlinePass) return
    this.app.changeMeshToCurrentViewMode(mesh)
    this.outlinePass.selectedObjects = []
  }

  // 高亮多个模型的接口
  public highLightMeshes(meshes: Mesh[]) {
    if (!this.outlinePass) return
    meshes.forEach((mesh) => {
      const material = mesh.material as MeshBasicMaterial
      material.color.set(this.highLightColor)
      material.opacity = 1
      // mesh.renderOrder = 10
    })
    this.outlinePass.selectedObjects.push(...meshes)
  }

  // 取消所有模型的高亮
  public cancelAllHighLightMeshes() {
    if (!this.outlinePass) return
    this.app.changeToCurrentViewMode()
    this.outlinePass.selectedObjects = []
  }
}
