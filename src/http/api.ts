/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 17:00:00
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-21 10:09:31
 * @FilePath: \kdPlankCheck\src\http\api.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import axios from 'axios'

class Http {
  static get(url: string, params: any) {
    return axios.get(url, { params })
  }
  static post(url: string, data: any) {
    return axios.post(url, data)
  }
}

// 获取场景数据
export async function getSceneInfo(sceneFileId: string) {
  const params = {
    ReceiveFileID: sceneFileId,
  }
  return await Http.get(`https://ku.kefan.cn:9000/api/SpiOrderMag/Download`, params)
}

// 获取所有的板材编码
export async function getBoardRefCodes() {
  const response = await Http.get(`https://ku.kefan.cn:9000/api/KFCraft/GetAllBoardCores`, {})
  return response
}

// 请求纹理图片的接口
export async function getTextureImg(textureName: string) {
  const response = await Http.get(`http://192.168.10.124:2947/api/Color/GetImageByname`, {
    name: textureName,
  })
  return response
}

export async function getTextureImgs(textureNames: string) {
  const response = await Http.get(`http://192.168.10.124:2947/api/Color/GetImagebyNameList`, {
    nameListStr: textureNames,
  })
  return response
}
