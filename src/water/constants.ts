const CONTROL_GPIO_PIN = 16

const HOURS_PER_WEEK: Record<string, number | undefined> = {
  "January": 1.7,
  "February": 2.46,
  "March": 4.1,
  "April": 5.6,
  "May": 7.5,
  "June": 8.58,
  "July": 9.54,
  "August": 8.5,
  "September": 6.27,
  "October": 4.4,
  "November": 2.3,
  "December": 1.7,
} as const

const DAYS_PER_WEEK = 2

