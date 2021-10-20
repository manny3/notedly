module.exports = {
  // 要求時解析註記的作者資訊
  author: async (note, args, { models }) => {
    return await models.User.findById(note.author)
  },
  // 要求時解析註記的favoritedBy 資訊
  favoritedBy: async (note, args, { models }) => {
    return await models.User.find({_id: { $in: note.favoritedBy}})
  }
}