interface Duration {
  seconds: number
  minutes: number
  hours: number
}

export const formatDuration = (duration: Duration) => {
  const { seconds, minutes, hours } = duration
  return {
    seconds: seconds < 10 ? '0' + seconds : seconds.toString(),
    minutes: minutes < 10 ? '0' + minutes : minutes.toString(),
    hours: hours < 10 ? '0' + hours : hours.toString(),
  }
}
