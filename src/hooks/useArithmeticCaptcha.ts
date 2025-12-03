import { useCallback, useMemo, useState } from 'react'

interface UseArithmeticCaptchaOptions {
  minA?: number
  maxA?: number
  minB?: number
  maxB?: number
}

const getRandomInt = (min: number, max: number) => {
  const lower = Math.ceil(min)
  const upper = Math.floor(max)
  return Math.floor(Math.random() * (upper - lower + 1)) + lower
}

export function useArithmeticCaptcha({
  minA = 3,
  maxA = 7,
  minB = 2,
  maxB = 6,
}: UseArithmeticCaptchaOptions = {}) {
  const [numbers, setNumbers] = useState(() => ({
    a: getRandomInt(minA, maxA),
    b: getRandomInt(minB, maxB),
  }))

  const regenerate = useCallback(() => {
    setNumbers({
      a: getRandomInt(minA, maxA),
      b: getRandomInt(minB, maxB),
    })
  }, [minA, maxA, minB, maxB])

  const result = useMemo(() => numbers.a * numbers.b, [numbers])
  const expression = useMemo(() => `${numbers.a} × ${numbers.b}`, [numbers])

  return {
    expression,
    result,
    regenerate,
  }
}



