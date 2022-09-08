const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// model
const User = require("../models/User");

// helpers
const createUserToken = require("../helpers/create-user-token");
const getToken = require("../helpers/get-token");
const getUserByToken = require("../helpers/get-user-by-token");
const { imageUpload } = require("../helpers/image-upload");

module.exports = {
  register: async (req, res) => {
    const { name, email, phone, password, confirmpassword } = req.body;

    // validations
    if (!name) {
      res.status(422).json({ message: "O nome é obrigatório." });
      return;
    }

    if (!email) {
      res.status(422).json({ message: "O e-mail é obrigatório." });
      return;
    }

    if (!phone) {
      res.status(422).json({ message: "O telefone é obrigatório." });
      return;
    }

    if (!password) {
      res.status(422).json({ message: "A senha é obrigatória." });
      return;
    }

    if (!confirmpassword) {
      res
        .status(422)
        .json({ message: "A confirmação de senha é obrigatória." });
      return;
    }

    if (password !== confirmpassword) {
      res.status(422).json({
        message: "A senha e a confirmação de senha devem ser iguais.",
      });
      return;
    }

    // // check if user exists
    const userExists = await User.findOne({ email: email });

    if (userExists) {
      res.status(422).json({
        message: "E-mail já em uso.",
      });
      return;
    }

    // create a password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // create a user
    const user = new User({
      name: name,
      email: email,
      phone: phone,
      password: passwordHash,
    });

    try {
      const newUser = await user.save();
      await createUserToken(newUser, req, res);
      return;
    } catch (error) {
      res.status(500).json({ message: error });
    }
  },

  login: async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
      res.status(422).json({ message: "O e-mail é obrigatório." });
      return;
    }

    if (!password) {
      res.status(422).json({ message: "A senha é obrigatória." });
      return;
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      res.status(422).json({
        message: "Não há usuário cadastrado com esse e-mail.",
      });
      return;
    }

    // check if password matches with db password
    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      res.status(422).json({
        message: "Senha inválida.",
      });

      return;
    }

    await createUserToken(user, req, res);
  },

  checkUser: async (req, res) => {
    let currentUser;

    if (req.headers.authorization) {
      const token = getToken(req);
      const decoded = jwt.verify(token, "nossosecret");

      currentUser = await User.findById(decoded.id);

      currentUser.password = undefined;
    } else {
      currentUser = null;
    }

    res.status(200).send(currentUser);
  },

  getUserById: async (req, res) => {
    const id = req.params.id;
    const user = await User.findById(id).select("-password");

    if (!user) {
      res.status(422).json({ message: "Usuário não encontrado." });
      return;
    }

    res.status(200).json({ user });
  },

  editUser: async (req, res) => {
    const id = req.params.id;

    // check if user exists
    const token = getToken(req);
    const user = await getUserByToken(token);

    const { name, email, phone, password, confirmpassword } = req.body;

    if (req.file) {
      user.image = req.file.filename;
    }

    // validations
    if (!name) {
      res.status(422).json({ message: "O nome é obrigatório." });
      return;
    }

    user.name = name;

    if (!email) {
      res.status(422).json({ message: "O e-mail é obrigatório." });
      return;
    }

    // cheack if email is already in use
    const userExists = await User.findOne({ email: email });

    if (user.email !== email && userExists) {
      res.status(422).json({ message: "Por favor, utilize outro e-mail." });
      return;
    }

    user.email = email;

    if (!phone) {
      res.status(422).json({ message: "O telefone é obrigatório." });
      return;
    }

    user.phone = phone;

    if (password !== confirmpassword) {
      res.status(422).json({ message: "As senhas não conferem." });
    } else if (password === confirmpassword && password != null) {
      // creating password
      const salt = await bcrypt.genSalt(12);
      const reqPassword = req.body.password;
      const passwordHash = await bcrypt.hash(reqPassword, salt);

      user.password = passwordHash;
    }

    try {
      // return user updated data
      const updatedUser = await User.findOneAndUpdate(
        { _id: user._id },
        { $set: user },
        { new: true }
      );
      res.status(200).json({
        message: "Usuário atualizado com sucesso.",
        data: updatedUser,
      });
    } catch (error) {
      res.status(500).json({ message: error });
      return;
    }
  },
};
