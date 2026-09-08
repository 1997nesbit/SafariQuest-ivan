import { apiUpload } from '../lib/api'

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const { url } = await apiUpload<{ url: string }>('/api/uploads/images/', formData)
  return url
}
