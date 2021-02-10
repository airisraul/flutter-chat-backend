const { io } = require('../index');
const Band = require('../models/band');
const Bands = require('../models/bands');
const { comprobarJWT } = require('../helpers/jwt');
const { usuarioConectado, usuarioDesconectado, grabarMensaje } = require('../controllers/socket');


const bands = new Bands();

bands.addBand(new Band('Sepultura!!!'));
bands.addBand(new Band('Mecano'));
bands.addBand(new Band('David Bisbal'));
bands.addBand(new Band('Ozzi Osburne'));


// Mensajes de Sockets
io.on('connection', client => {
    console.log('Cliente conectado');

    //client.emit('active-bands', bands.getBands());
    const [valido, uid] = comprobarJWT(client.handshake.headers['x-token']);

    if (!valido) { return client.disconnect(); }
    console.log('cliente autenticado');

    usuarioConectado(uid);

    // Ingresar al usuario a una sala en particular
    // Sala global, client.id, 
    client.join(uid);

    client.on('mensaje-personal', async(payload) => {
        // Grabar mensaje en bbdd
        await grabarMensaje(payload);

        io.to(payload.para).emit('mensaje-personal', payload);
    });


    client.on('disconnect', () => {
        console.log('Cliente desconectado');
        usuarioDesconectado(uid);
    });

    client.on('mensaje', (payload) => {
        console.log('Mensaje', payload);

        io.emit('mensaje', { admin: 'Nuevo mensaje' });

    });

    // client.on('emitir-mensaje', (payload) => {
    //     //console.log(payload);
    //     //io.emit('nuevo-mensaje', payload); //emite a todos
    //     client.broadcast.emit('nuevo-mensaje', payload); // Emite a todos menos al que lo envia.

    // });
    client.on('vote-band', (payload) => {

        bands.voteBand(payload.id);
        io.emit('active-bands', bands.getBands());
    });

    client.on('add-band', (payload) => {
        const newBand = new Band(payload.name);

        bands.addBand(newBand);
        io.emit('active-bands', bands.getBands());
    });

    client.on('delete-band', (payload) => {

        bands.deleteBand(payload.id);
        io.emit('active-bands', bands.getBands());
    });

});