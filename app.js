const express = require("express");
const app = express();
var socket = require('socket.io')

const path = require("path");
const db = require("./db");
var cookieParser = require("cookie-parser");
var bodyParser = require('body-parser');
var moment = require('moment');

app.set("port", process.env.port || 80);
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "views"));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

// Area de login
app.get("/", (req, res, next) => {
    res.redirect("/login");
});

app.get("/login", (req, res, next) => {
    if (req.cookies.sessionCode) {
        db.Usuario.findOne({ sessionCode: req.cookies.sessionCode },
            (err, docs) => {
                render = true;
                if (docs.rolname == "farmacia") {
                    res.redirect("/panel/ventas");
                    render = false;
                }
                if (docs.rolname == "admin") {
                    res.redirect("/admin/resumen")
                    render = false;
                }
                if (render) {
                    res.render("login");
                }
            }
        );
    } else {
        res.render("login");
    }
});

app.post("/login", (req, res, next) => {
    db.Usuario.findOne({ username: req.body.user }, (err, docs) => {
        if (docs && docs.username == req.body.user && docs.password == req.body.pass) {
            // Crear sesión y redirigir
            console.log(docs);
            if (docs.rolname == 'farmacia') {
                console.log('se crea la sesión');
                sessionCode = Date.now().toString();
                docs.sessionCode = sessionCode;
                docs.save();
                res.cookie('sessionCode', sessionCode);
                res.redirect('panel/ventas');
            }
            if (docs.rolname == 'admin') {
                sessionCode = Date.now().toString();
                docs.sessionCode = sessionCode;
                docs.save();
                res.cookie('sessionCode', sessionCode);
                res.redirect('/admin/resumen');
            }
            if (docs.rolname != 'admin' && docs.rolname != 'farmacia') {
                console.log('El rol no se reconoce. Error');
            }

        } else {
            res.redirect('/login');
        }
    });
});


// Area de administracion
app.get('/admin/resumen', (req, res, next) => {
    if (req.cookies.sessionCode) {
        db.Usuario.findOne({ sessionCode: req.cookies.sessionCode }, (err, docs) => {
            if (docs && docs.rolname == 'admin') {
                docs.save();
                db.Usuario.find({ rolname: 'farmacia' }, (err, farms) => {
                    res.render('admin/resumen', {
                        user: docs,
                        farmacias: farms
                    })
                })
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.get('/admin/stock', (req, res, next) => {
    if (req.cookies.sessionCode) {
        db.Usuario.findOne({ sessionCode: req.cookies.sessionCode }, (err, docs) => {
            if (docs && docs.rolname == 'admin') {
                docs.save();
                db.Usuario.find({ rolname: 'farmacia' }, (err, farms) => {
                    res.render('admin/stock', {
                        user: docs,
                        farmacias: farms
                    })
                })
            }
        });
    } else {
        res.redirect('/login');
    }
});

app.get("/admin/informe", (req, res, next) => {
    if (req.cookies.sessionCode) {
        db.Usuario.findOne({ sessionCode: req.cookies.sessionCode }, (err, docs) => {
            if (docs && docs.rolname == "admin") {
                docs.save();
                db.Usuario.find({ rolname: 'farmacia' }, (err, farms) => {
                    res.render('admin/informes', {
                        user: docs,
                        farmacias: farms
                    });
                });
            } else {
                res.redirect('/login');
            }
        });

    } else {
        res.redirect('/login');
    }
});

// Area de farmacias
app.get("/panel/ventas", (req, res, next) => {
    if (req.cookies.sessionCode) {
        db.Usuario.findOne({ sessionCode: req.cookies.sessionCode }, (err, docs) => {
            if (docs && docs.rolname == "farmacia") {
                docs.save();
                res.render('panel/ventas', {
                    user: docs
                });
            } else {
                res.redirect('/login');
            }
        });

    } else {
        res.redirect('/login');
    }
});

app.get("/panel/stock", (req, res, next) => {
    if (req.cookies.sessionCode) {
        db.Usuario.findOne({ sessionCode: req.cookies.sessionCode }, (err, docs) => {
            if (docs && docs.rolname == "farmacia") {
                docs.save();
                res.render('panel/stock', {
                    user: docs
                });
            } else {
                res.redirect('/login');
            }
        });

    } else {
        res.redirect('/login');
    }
});

app.get("/panel/informe", (req, res, next) => {
    if (req.cookies.sessionCode) {
        db.Usuario.findOne({ sessionCode: req.cookies.sessionCode }, (err, docs) => {
            if (docs && docs.rolname == "farmacia") {
                docs.save();
                res.render('panel/informe', {
                    user: docs
                });
            } else {
                res.redirect('/login');
            }
        });

    } else {
        res.redirect('/login');
    }
});

app.post('/nuevoPedido', (req, res, next) => {
    console.log('Creando nuevo pedido...')
    if (!req.body.documentoComprador) {
        res.send('<script>alert("¡Debes incluir el documento del comprador!"); location.href = "/panel/ventas";</script>');
        res.redirect('/panel/ventas');
        next();
    }
    console.log();
    if (!(req.body.carritoCompletoSTRING.length > 5)) {
        res.send('<script>alert("¡Debes incluir productos en el pedido!"); location.href = "/panel/ventas";</script>');
        res.redirect('/panel/ventas');
    }

    // Aqui solo llega si todo está correcto
    pedido = JSON.parse(req.body.carritoCompletoSTRING);
    comprador = req.body.documentoComprador;
    vendedor = req.body.username;
    fecha = new Date();

    db.Usuario.findOne({ username: vendedor }, (err, doc) => {
        if (err) {
            console.log(err);
        } else {


            nuevoArrayProducts = [];
            // Descontar del STOCK

            // console.log(pedido[i].idProducto);
            j = 0;
            doc.products.forEach(producto => {
                for (let i = 0; i < pedido.length; i++) {
                    if (producto.id == pedido[i].idProducto) {
                        console.log('Se paso por aquí ');
                        nuevoArrayProducts[j] = {
                            nombre: producto.nombre,
                            marca: producto.marca,
                            unidad: producto.unidad,
                            precio: producto.precio,
                            id: producto.id,
                            cantidad: producto.cantidad - parseInt(pedido[i].cantidad)
                        }
                        break;
                    } else {
                        nuevoArrayProducts[j] = producto;
                    }
                }
                j++;
            });


            // console.log(doc.products);
            console.log(nuevoArrayProducts);
            pedido.push({
                fechaPedido: fecha.getFullYear() + '/' + (parseInt(fecha.getMonth()) + 1) + '/' + fecha.getDate() + ' - ' + fecha.getHours() + ':' + fecha.getMinutes(),
                id: Date.now(),
                dniComprador: comprador,
                estadoPedido: true
            });

            //Guardar PEDIDO
            doc.products = nuevoArrayProducts;
            doc.pedidos.push(pedido);
            doc.save();
        }
    });

    console.log('Pedido creado.')
    res.send('<script>alert("¡Pedido Creado!"); location.href = "/panel/ventas";</script>');
});

app.post('/deleteProducto', (req, res, next) => {
    datos = req.body.datos;
    if (datos) {
        datos = datos.split(',');

        username = datos[1];
        id = datos[0];



        db.Usuario.findOne({ username: username }, (err, doc) => {
            if (err) {

            } else if (doc) {
                doc.pedidos.forEach((pedido, index, object) => {
                    if (pedido[pedido.length - 1].id == id) {
                        console.log('Pedido Encontrado');
                        console.log(doc.pedidos[index]);
                        pedidoEliminar = doc.pedidos[index];

                        //####
                        j = 0;
                        nuevoArrayProducts = [];
                        doc.products.forEach(producto => {
                            for (let i = 0; i < pedidoEliminar.length - 1; i++) {
                                if (producto.id == pedidoEliminar[i].idProducto) {
                                    console.log('Se paso por aquí ');
                                    nuevoArrayProducts[j] = {
                                        nombre: producto.nombre,
                                        marca: producto.marca,
                                        unidad: producto.unidad,
                                        precio: producto.precio,
                                        id: producto.id,
                                        cantidad: producto.cantidad + parseInt(pedidoEliminar[i].cantidad)
                                    }
                                    break;
                                } else {
                                    nuevoArrayProducts[j] = producto;
                                }
                            }
                            j++;
                        });
                        doc.products = nuevoArrayProducts;

                        doc.pedidos.splice(index, 1);
                        doc.save()
                    }
                });
            }
        });
        setTimeout(() => {
            res.redirect('/panel/ventas');
        }, 1000);
    } else { res.redirect('/panel/ventas') }
});

app.post('/devolverProducto', (req, res, next) => {
    datos = req.body.datos;
    if (datos) {
        datos = datos.split(',');

        username = datos[1];
        idPedido = datos[0];

        // console.log(username);
        // console.log(idPedido);


        db.Usuario.findOne({ username: username }, (err, doc) => {
            if (err) {

            } else if (doc) {
                nuevoArrayPedidos = [];
                j = 0;
                doc.pedidos.forEach((pedido, index, object) => {
                    if (pedido[pedido.length - 1].id == idPedido) {
                        console.log('Pedido Encontrado');
                        // console.log(pedido);
                        pedido[pedido.length - 1].estadoPedido = false;
                    }

                    nuevoArrayPedidos[j] = pedido;
                    j++;
                });
                // console.log(nuevoArrayPedidos);
                doc.pedidos = nuevoArrayPedidos;
                console.log(doc.pedidos);
                doc.markModified('pedidos');
                doc.save();
            }
        });
        setTimeout(() => {
            res.redirect('/panel/ventas');
        }, 1000);
    } else { res.redirect('/panel/ventas') }
});

app.get("/desconectar", (req, res, next) => {
    res.cookie('sessionCode', '');
    res.redirect('/');
});

var server = app.listen(app.get('port'), function() {
    console.log(app.get('port'));
    console.log('Servidor funcionando en puerto ' + app.get('port'));
});

// Movimientos en tiempo real entre servidor y cliente
let io = socket(server)
io.on('connection', function(socket) {
    console.log(`${socket.id} ha ingresado.`);
    socket.on("verProducto", (idPedido, idUsuario) => {
        db.Usuario.findOne({ username: idUsuario }, (err, doc) => {
            if (err) {
                console.log(err);
            } else {
                doc.pedidos.forEach((pedido) => {
                    if (pedido[pedido.length - 1].id == idPedido) {
                        io.emit('verPedido', (pedido))
                    }
                });
            }
        })
    });
    socket.on("solicitarDatos", (datos) => {
        console.log(datos);
        desdeFecha = datos[0];
        hastaFecha = datos[1];
        usuario = datos[2];

        aux = desdeFecha.split('-');
        desdeFecha = new Date(aux);

        aux = hastaFecha.split('-');
        hastaFecha = new Date(aux);


        db.Usuario.findOne({ username: usuario }, (err, doc) => {
            if (err) {
                console.log(err);
            } else {
                if (doc) {
                    if (desdeFecha < hastaFecha) {
                        //Pedidos devueltos [devueltos, completados] (Organizados)
                        a = [0, 0];
                        var pedidosActivos = [];
                        doc.pedidos.forEach(pedido => {
                            fechaPedido = pedido[pedido.length - 1].fechaPedido;
                            fechaPedido = fechaPedido.split(' ');
                            fechaPedido = fechaPedido[0];
                            fechaPedido = new Date(fechaPedido);

                            if (fechaPedido >= desdeFecha && fechaPedido <= hastaFecha) {
                                if (pedido[pedido.length - 1].estadoPedido) {
                                    a[0] = a[0] + 1;
                                    pedidosActivos.push(pedido);
                                } else {
                                    a[1] = a[1] + 1;
                                }
                            }
                        });
                        //Productos vendidos (Se organizan en CLIENTE)
                        b = [];
                        objAux = [];
                        doc.pedidos.forEach(pedido => {
                            fechaPedido = pedido[pedido.length - 1].fechaPedido;
                            fechaPedido = fechaPedido.split(' ');
                            fechaPedido = fechaPedido[0];
                            fechaPedido = new Date(fechaPedido);

                            if (fechaPedido >= desdeFecha && fechaPedido <= hastaFecha) {
                                for (let i = 0; i < pedido.length - 1; i++) {
                                    objAux.push({
                                        idProducto: pedido[i].idProducto,
                                        cantidad: pedido[i].cantidad
                                    });
                                }
                            }
                        });
                        b = objAux;
                        //Stock de productos actuales (Se organizan en CLIENTE)
                        c = [];
                        doc.products.forEach(producto => {
                            c.push(producto);
                        });

                        socket.emit('datosOrdenados', a, b, c, pedidosActivos);
                    } else {
                        socket.emit('error', 'La fecha de inicio debe ser anterior a la fecha del final.');
                    }
                } else {
                    socket.emit('error', 'Debes seleccionar la farmacia primero.');
                }
            }
        })
    });
    socket.on('adminFarmaciaStock', (data) => {
        db.Usuario.findOne({ username: data }, (err, docs) => {
            socket.emit('productData', (docs.products));
        })
    });
    socket.on('productosOrdenados', (datos) => {
        console.log(datos.arrayProductos);
        console.log(datos.usernameFarmacia);
        db.Usuario.findOne({ username: datos.usernameFarmacia }, (err, doc) => {
            if (!err) {
                doc.products = datos.arrayProductos;
                doc.save();
            }
            socket.emit('redirect', ('/admin/stock'));
        });
    });
});