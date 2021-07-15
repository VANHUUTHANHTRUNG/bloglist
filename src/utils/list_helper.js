const dummy = (blogs) => 1

const totalLikes = (blogs) =>
  blogs.reduce((likeSum, blog) => likeSum + blog.likes, 0)

const favoriteBlog = (blogs) => {
  const { title, author, likes, ...rest } = blogs.reduce(
    (mostLikesBlog, blog) =>
      mostLikesBlog.likes > blog.likes ? mostLikesBlog : blog
  )
  return { title, author, likes }
}

const mostBlogs = (blogs) => {
  const authors = [...blogs.map((blog) => blog.author)]
  const uniqueAuthors = [...new Set(authors)]
  const blogsPerAuthor = uniqueAuthors.map((uniqueAuthor) => {
    const blogsCount = blogs.reduce(
      (occurrence, blog) =>
        blog.author === uniqueAuthor ? occurrence + 1 : occurrence,
      0
    )
    return {
      author: uniqueAuthor,
      blogsCount,
    }
  })
  const mostBlogsAuthor = blogsPerAuthor.reduce((mostBlogsAuthor, author) =>
    mostBlogsAuthor.blogsCount > author.blogsCount ? mostBlogsAuthor : author
  )
  return {
    author: mostBlogsAuthor.author,
    blogs: mostBlogsAuthor.blogsCount,
  }
}

const mostLikes = (blogs) => {
  const authors = [...blogs.map((blog) => blog.author)]
  const uniqueAuthors = [...new Set(authors)]
  const likesPerAuthor = uniqueAuthors.map((uniqueAuthor) => {
    const likesCount = blogs.reduce(
      (likesSum, blog) =>
        blog.author === uniqueAuthor ? likesSum + blog.likes : likesSum,
      0
    )
    return {
      author: uniqueAuthor,
      likesCount,
    }
  })
  const mostLikesAuthor = likesPerAuthor.reduce((mostLikesAuthor, author) =>
    mostLikesAuthor.likesCount > author.likesCount ? mostLikesAuthor : author
  )
  return {
    author: mostLikesAuthor.author,
    likes: mostLikesAuthor.likesCount,
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
