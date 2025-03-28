export function saveToJson(data: any, filename: string) {
  const json = JSON.stringify(data)
  const blob = new Blob([json], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()

  // 清理
  setTimeout(() => {
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }, 0)
}

export function saveToFile(data: any, fileName: string) {
  // 创建a标签
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)]))
  a.download = fileName
  a.click()
}
