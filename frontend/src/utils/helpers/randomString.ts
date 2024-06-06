export const randomString = (type: string) => {
  const ext = type.split('/')[1]
  const length = 12
  const name = Math.round(Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))
    .toString(36)
    .slice(1)
  return name + '.' + ext
}
