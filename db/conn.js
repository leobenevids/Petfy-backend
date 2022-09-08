const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    `mongodb+srv://petfyUser:zMsCDB5uBpiVCEVg@cluster0.gkwjmy0.mongodb.net/?retryWrites=true&w=majority`
  );
  console.log("Conectado ao banco de dados");
};

connectDB().catch((error) => console.log(error));

module.exports = mongoose;
