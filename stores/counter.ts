import { defineStore } from 'pinia'

// 定义状态接口
interface CounterState {
  count: number
}

export const useCounterStore = defineStore('counter', {
  state: (): CounterState => ({
    count: 0
  }),
  actions: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    }
  },
  getters: {
    doubleCount(): number {
      return this.count * 2
    }
  }
}) 