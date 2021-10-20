module.exports = {
  notes: async (parent, args, { models }) => {
    return await models.Note.find()
  },
  note: async (parent, args, { models }) => {
    return await models.Note.findById(args.id)
  },
  // 根據使用者名稱尋找使用者
  user: async (parent, { username }, { models }) => {
    return await models.User.findOne({ username })
  },
  // 尋找所有使用者
  users: async (parent, args, { models }) => {
    return await models.User.find({})
  },
  // 根據目前使用者context尋找使用者
  me: async (parent, args, { models, user}) => {
    return await models.User.findById(user.id)
  },
  noteFeed: async (parent, { cursor }, { models }) => {
    
    const limit = 10;

    let hasNextPage = false;

    let cursorQuery = {};

    if (cursor) {
      cursorQuery = { _id: { $lt: cursor }}
    }

    let notes = await models.User.find(cursorQuery)
      .sort({ _id: - 1 })
      .limit(limit + 1);

    if (notes.length > limit) {
      hasNextPage = true;
      notes = notes.slice(0, -1);
    }

    const newCursor = notes[notes.length - 1]._id;

    return { 
      notes,
      cursor: newCursor,
      hasNextPage
    }
  }
}