import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,         // ⭐ Đổi thành port bạn muốn
    host: true,          // ⭐ Cho phép truy cập từ máy khác
  },
})
