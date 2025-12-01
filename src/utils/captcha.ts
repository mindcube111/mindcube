/**
 * 数学验证码工具函数
 * 生成简单的数学计算题作为验证码
 */

export interface CaptchaChallenge {
  question: string
  answer: number
  id: string
}

/**
 * 生成随机数字（min 到 max 之间）
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 生成数学验证码题目
 * @returns 验证码挑战对象，包含题目、答案和ID
 */
export function generateCaptcha(): CaptchaChallenge {
  const operations = ['+', '-', '×']
  const operation = operations[randomInt(0, operations.length - 1)]
  
  let num1: number
  let num2: number
  let answer: number
  
  switch (operation) {
    case '+':
      num1 = randomInt(1, 10)
      num2 = randomInt(1, 10)
      answer = num1 + num2
      break
    case '-':
      num1 = randomInt(5, 20)
      num2 = randomInt(1, num1)
      answer = num1 - num2
      break
    case '×':
      num1 = randomInt(1, 10)
      num2 = randomInt(1, 10)
      answer = num1 * num2
      break
    default:
      num1 = randomInt(1, 10)
      num2 = randomInt(1, 10)
      answer = num1 + num2
  }
  
  const question = `${num1} ${operation} ${num2} = `
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  
  return {
    question,
    answer,
    id,
  }
}

/**
 * 验证验证码答案
 * @param userAnswer 用户输入的答案
 * @param correctAnswer 正确答案
 * @returns 是否验证通过
 */
export function verifyCaptcha(userAnswer: string | number, correctAnswer: number): boolean {
  const userNum = typeof userAnswer === 'string' ? parseInt(userAnswer.trim(), 10) : userAnswer
  return !isNaN(userNum) && userNum === correctAnswer
}


