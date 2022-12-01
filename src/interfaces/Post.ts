interface Post {
  id: string,
  title: string
  content: string,
  slug: string
  createdAt?: Date
  updatedAt?: Date
}

interface PostDTO {
  id?: string
  title: string,
  content: string,
  slug: string,
  createdAt: Date
  updatedAt?: Date
}

export {
  Post,
  PostDTO
}