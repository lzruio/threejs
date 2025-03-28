/*
 * @Author: lzr 259867057@qq.com
 * @Date: 2025-03-10 16:19:53
 * @LastEditors: lzr 259867057@qq.com
 * @LastEditTime: 2025-03-10 16:30:32
 * @FilePath: \kdPlankCheck\src\utils\promiseUtil.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// 用于同步等待
class WaitingPromise {
  private _isPending: boolean = false
  private _promise: Promise<any> = new Promise(() => {})
  private _resolve: (value: any) => void = () => {}
  private _reject: (reason: any) => void = () => {}

  constructor() {
    this._isPending = false
    this.pending()
  }

  getPromise() {
    return this._promise
  }

  pending() {
    if (this._isPending) {
      return
    }
    this._isPending = true
    this._promise = new Promise((resolve, reject) => {
      this._resolve = (value) => {
        this._isPending = false
        resolve(value)
      }
      this._reject = (reason) => {
        this._isPending = false
        reject(reason)
      }
    })
  }

  resolve(value: any) {
    this._resolve(value)
  }

  reject(reason: any) {
    this._reject(reason)
  }

  // 实现 then 方法，使其像 Promise 一样工作
  then(onFulfilled: (value: any) => any, onRejected: (reason: any) => any) {
    return this._promise.then(onFulfilled, onRejected)
  }

  catch(onRejected: (reason: any) => any) {
    return this._promise.catch(onRejected)
  }

  finally(onFinally: () => void) {
    return this._promise.finally(onFinally)
  }
}

export { WaitingPromise }
