import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Google Translate thay các text node bằng thẻ <font>, làm React báo lỗi
// "removeChild/insertBefore ... not a child of this node". Đoạn vá này bỏ qua thao tác lỗi đó.
if (typeof Node === 'function' && Node.prototype) {
  const removeChildGoc = Node.prototype.removeChild
  Node.prototype.removeChild = function (child) {
    if (child.parentNode !== this) {
      return child
    }
    return removeChildGoc.apply(this, arguments)
  }

  const insertBeforeGoc = Node.prototype.insertBefore
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode
    }
    return insertBeforeGoc.apply(this, arguments)
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
