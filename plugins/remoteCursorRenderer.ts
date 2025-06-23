import Quill from 'quill'

interface UserState {
  user?: {
    name?: string
    color?: string
    cursorPosition?: number | null
  }
}

export const renderRemoteCursors = (quill: any, awareness: any) => {
  if (!quill || !awareness) {
    console.warn('Quill 或 Awareness 未初始化')
    return
  }

  // 清除之前的光标
  const existingCursors = document.querySelectorAll('.remote-cursor')
  existingCursors.forEach((cursor) => cursor.remove())

  const allStates = awareness.getStates()
  const users: UserState[] = []

  for (const [clientID, state] of allStates.entries()) {
    if (
      state && 
      state.user && 
      state.user.cursorPosition !== undefined && 
      state.user.cursorPosition !== null
    ) {
      users.push(state)
    }
  }

  users.forEach((state) => {
    try {
      const cursorPosition = state.user!.cursorPosition!
      
      // 添加更多的安全检查
      if (typeof cursorPosition !== 'number') {
        console.warn(`无效的光标位置: ${cursorPosition}`)
        return
      }

      // 检查文档长度
      const documentLength = quill.getLength()
      if (cursorPosition > documentLength) {
        console.warn(`光标位置 ${cursorPosition} 超出文档长度 ${documentLength}`)
        return
      }

      const bounds = quill.getBounds(cursorPosition)

      if (!bounds) {
        console.warn(`无法获取位置 ${cursorPosition} 的边界`)
        return
      }

      const cursorElement = document.createElement('div')
      cursorElement.classList.add('remote-cursor')
      cursorElement.style.position = 'absolute'
      cursorElement.style.left = `${bounds.left}px`
      cursorElement.style.top = `${bounds.top}px`
      cursorElement.style.backgroundColor = state.user!.color || 'blue'
      cursorElement.style.width = '2px'
      cursorElement.style.height = `${bounds.height}px`

      const containerTooltip = document.createElement('div')
      const tooltipElement = document.createElement('div')
      tooltipElement.classList.add('remote-cursor-tooltip')
      tooltipElement.textContent = state.user!.name || '匿名用户'
      tooltipElement.style.visibility = 'visible'
      tooltipElement.style.opacity = '0.7'
      tooltipElement.style.position = 'absolute'
      tooltipElement.style.left = '12px'
      tooltipElement.style.top = '15px'
      tooltipElement.style.backgroundColor = state.user!.color || 'blue'
      tooltipElement.style.color = 'white'
      tooltipElement.style.fontSize = '10px'
      tooltipElement.style.padding = '2px'
      tooltipElement.style.borderRadius = '3px'
      tooltipElement.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'
      tooltipElement.style.fontWeight = '500'
      tooltipElement.style.borderRadius = '10px'

      containerTooltip.appendChild(tooltipElement)
      cursorElement.appendChild(containerTooltip)

      const editorContainer = document.querySelector('.ql-container')
      if (editorContainer) {
        editorContainer.appendChild(cursorElement)
      }
    } catch (error) {
      console.error('渲染光标时出错:', error, {
        user: state.user
      })
    }
  })
} 