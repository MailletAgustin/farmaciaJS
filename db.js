const mongoose = require("mongoose");
const uri =
  "mongodb+srv://admin:admin@cluster0.mt0nr.mongodb.net/farmacias";
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .catch((err) => console.log(err));
mongoose.connection.once("open", () => {
  console.log("Conexion a la base de datos creada con exito");
});

var UsuarioSchema = mongoose.Schema({
  username: String,
  password: String,
  rolname: String,
  farmaciaAsociada: String,
  sessionCode: String,
  products: Array,
  pedidos: Array
});

var ProductoSchema = mongoose.Schema({
  nombre: String,
  marca: String,
  unidad: String,
  precio: Number,
  id: String
});


exports.Usuario = mongoose.model("Usuario", UsuarioSchema);
exports.Producto = mongoose.model("Producto", ProductoSchema);
