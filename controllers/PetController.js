// model
const Pet = require("../models/Pet");

// helpers
const getToken = require("../helpers/get-token");
const getUserByToken = require("../helpers/get-user-by-token");
const ObjectId = require("mongoose").Types.ObjectId;

module.exports = {
  create: async (req, res) => {
    const { name, species, description, age, weight } = req.body;

    const images = req.files;

    const available = true;

    // images upload

    // validations
    if (!name) {
      res.status(422).json({ message: "O nome é obrigatório." });
      return;
    }

    if (!species) {
      res.status(422).json({ message: "A espécie é obrigatória." });
      return;
    }

    if (!age) {
      res.status(422).json({ message: "A idade é obrigatória." });
      return;
    }

    if (!weight) {
      res.status(422).json({ message: "O peso é obrigatório." });
      return;
    }



    if (images.length === 0) {
      res.status(422).json({ message: "A imagem é obrigatória." });
      return;
    }

    // get pet owner
    const token = getToken(req);
    const user = await getUserByToken(token);

    // create a pet
    const pet = new Pet({
      name,
      species,
      description,
      age,
      weight,
      available,
      images: [],
      user: {
        _id: user._id,
        name: user.name,
        image: user.image,
        phone: user.phone,
      },
    });

    images.map((image) => {
      pet.images.push(image.filename);
    });

    try {
      const newPet = await pet.save();
      res.status(201).json({ message: "Pet cadastrado com sucesso!", newPet });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  },

  getAll: async (req, res) => {
    const pets = await Pet.find().sort("-createdAt");

    res.status(200).json({
      pets: pets,
    });
  },

  getAllUserPets: async (req, res) => {
    // get user from token
    const token = getToken(req);
    const user = await getUserByToken(token);

    const pets = await Pet.find({ "user._id": user._id }).sort("-createdAt");

    res.status(200).json({ pets });
  },

  getAllUserAdoptions: async (req, res) => {
    // get user from token
    const token = getToken(req);
    const user = await getUserByToken(token);

    const pets = await Pet.find({ "adopter._id": user._id }).sort("-createdAt");

    res.status(200).json({ pets });
  },

  getPetById: async (req, res) => {
    const id = req.params.id;

    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: "ID inválido." });
      return;
    }

    // check if pet exists
    const pet = await Pet.findById(id);

    if (!pet) {
      res.status(404).json({ message: "Pet não encontrado." });
    }

    res.status(200).json({ pet: pet });
  },

  removePetById: async (req, res) => {
    const id = req.params.id;

    // check if id is valid
    if (!ObjectId.isValid(id)) {
      res.status(422).json({ message: "ID inválido." });
      return;
    }

    // check if pet exists
    const pet = await Pet.findById(id);

    if (!pet) {
      res.status(404).json({ message: "Pet não encontrado." });
      return;
    }

    // check if logged user registered the pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res.status(422).json({
        message:
          "Houve um problema ao processar a solicitação. Tente novamente mais tarde.",
      });
      return;
    }

    await Pet.findByIdAndRemove(id);

    res.status(200).json({ message: "Pet removido com sucesso." });
  },

  updatePet: async (req, res) => {
    const id = req.params.id;
    const { name, species, description, age, weight, available } =
      req.body;
    const images = req.files;

    const updatedData = {};

    // check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: "Pet não encontrado." });
      return;
    }

    // check if logged user registered the pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res.status(422).json({
        message:
          "Houve um problema ao processar a solicitação. Tente novamente mais tarde.",
      });
      return;
    }

    // validations
    if (!name) {
      res.status(422).json({ message: "O nome é obrigatório." });
      return;
    } else {
      updatedData.name = name;
    }

    if (!species) {
      res.status(422).json({ message: "A espécie é obrigatória." });
      return;
    } else {
      updatedData.species = species;
    }

    if (!description) {
      res.status(422).json({ message: "A descrição é obrigatória." });
      return;
    } else {
      updatedData.description = description;
    }

    if (!age) {
      res.status(422).json({ message: "A idade é obrigatória." });
      return;
    } else {
      updatedData.age = age;
    }

    if (!weight) {
      res.status(422).json({ message: "O peso é obrigatório." });
      return;
    } else {
      updatedData.weight = weight;
    }

    if (images.length === 0) {
      res.status(422).json({ message: "A imagem é obrigatória." });
      return;
    } else {
      updatedData.images = [];
      images.map((image) => {
        updatedData.images.push(image.filename);
      });
    }

    await Pet.findByIdAndUpdate(id, updatedData);

    res.status(200).json({ message: "Pet atualizado com sucesso." });
  },

  schedule: async (req, res) => {
    const id = req.params.id;

    // check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: "Pet não encontrado." });
      return;
    }

    // check if user registered the pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.equals(user._id)) {
      res.status(422).json({
        message: "Você não pode agendar uma visita com seu próprio pet.",
      });
      return;
    }

    // check if user has already scheduled a visit
    if (pet.adopter) {
      if (pet.adopter._id.equals(user._id)) {
        res.status(422).json({
          message: "Você já agendou uma visita para este pet.",
        });

        return;
      }
    }

    // add user as pet adopter
    pet.adopter = {
      _id: user._id,
      name: user.name,
      image: user.image,
    };

    await Pet.findByIdAndUpdate(id, pet);

    res.status(200).json({
      message: `A visita foi agendada com sucesso, entre em contato com ${pet.user.name} pelo telefone ${pet.user.phone}.`,
    });
  },

  concludeAdoption: async (req, res) => {
    const id = req.params.id;

    // check if pet exists
    const pet = await Pet.findOne({ _id: id });

    if (!pet) {
      res.status(404).json({ message: "Pet não encontrado." });
      return;
    }

    // check if logged user registered the pet
    const token = getToken(req);
    const user = await getUserByToken(token);

    if (pet.user._id.toString() !== user._id.toString()) {
      res.status(422).json({
        message:
          "Houve um problema ao processar a solicitação. Tente novamente mais tarde.",
      });
      return;
    }

    pet.available = false;

    await Pet.findByIdAndUpdate(id, pet);

    res
      .status(200)
      .json({ message: "Parabéns, a adoção foi concluída com sucesso!" });
  },
};
