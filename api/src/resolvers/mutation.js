const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose');
const { AuthenticationError, ForbiddenError } = require('apollo-server-express')
require('dotenv').config()

const gravatar = require('../util/gravatar')


module.exports = {
  newNote: async (parent, args, { models, user }) => {
    if(!user) {
      throw new AuthenticationError('You must be signed in to create a note')
    }

    return await models.Note.create({
      content: args.content,
      author: mongoose.Types.ObjectId(user.id)
    });
  },
  deleteNote: async (parent, { content, id }, { models, user }) => {
    if(!user) {
      throw new AuthenticationError('You must be signed in to delete a note')
    }

    const note = await models.Note.findById(id);

    if(note && String(note.author) !== user.id) {
      throw new ForbiddenError("You don't have permissions to delete a note")
    }

    try {
      await note.remove();
      return true
    } catch (err) {
      return false;
    }
  },
  updateNote: async (parent, { content, id }, { models, user }) => {
    if(!user) {
      throw new AuthenticationError('You must be signed in to update a note')
    }

    const note = await models.Note.findById(id);

    if(note && String(note.author) !== user.id) {
      throw new ForbiddenError("You don't have permissions to update a note")
    }

    return await models.Note.findOneAndUpdate(
      { 
        _id: id 
      },
      {
        $set: { content }
      },
      {
        new: true
      }
    );
  },
  signUp: async (parent, {username, email, password }, { models }) => {
    // 將電子郵件正規化
    email = email.trim().toLowerCase();
    // 對密碼雜湊
    const hashed = await bcrypt.hash(password, 10)
    // 建立 gravatar url
    const avatar = gravatar(email);

    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hashed
      })

      // 建立並回傳json 網頁權杖
      return jwt.sign({ id: user._id }, process.env.JWT_SECRET)
    } catch (err) {
      console.log(err);

      throw new Error('Error creating account')
    }
  },
  signIn: async (parent, {username, email, password }, { models }) => {
    if(email) {
      email = email.trim().toLowerCase();
    }

    const user = await models.User.findOne({ 
      $or: [{ email }, { username }]
     });

     if(!user) {
       throw new AuthenticationError('Error signing in')
     }

     const valid = await bcrypt.compare(password, user.password);
     if(!valid) {
      throw new AuthenticationError('Error signing in')
    }

    // 建立並回傳json 網頁權杖
    return jwt.sign({ id: user._id }, process.env.JWT_SECRET)

  },
  toggleFavorite: async (parent, { id }, { models, user }) => {
    // 未傳遞使用者，則拋出驗證錯誤
    if(!user) {
      throw new AuthenticationError('You must be signed in')
    }
    // 檢查使用者是否已將註記加入最愛
    let noteCheck = await models.Note.findById(id);
    const hasUser = noteCheck.favoritedBy.indexOf(user.id);

    // 如果使用者存在於清單中
    // 將他們從清單中提取並將favoriteCount -1
    if (hasUser >= 0) {
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $pull: { 
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: -1
          }
        },
        {
          // new 設為true已回傳
          new: true
        }
      );
    } else {
      // 如果使用者不存在於清單中
      // 將他們從清單中提取並將favoriteCount +1
      return await models.Note.findByIdAndUpdate(
        id,
        {
          $push: { 
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: 1
          }
        },
        {
          new: true
        }
      )
    }

  }
}