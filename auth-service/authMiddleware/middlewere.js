const jwt = require("jsonwebtoken");
const SECRET = "your_secret_token_here";  

function authentificationToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) {return res.status(401).json({ message: "Token manquant" });}
    jwt.verify(token, SECRET, (err, userData) => {
        if (err) {return res.json({ message: "Token invalide" });}
        req.user = userData; 
        next();
    });
}

module.exports =  authentificationToken
