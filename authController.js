const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator')
const {secret} = require("./config")
const {PrismaClient} = require('@prisma/client')

const prisma = new PrismaClient()

const generateAccessToken = (id, roles) => {
    const payload = {
        id,
        roles
    }
    return jwt.sign(payload, secret, {expiresIn: "24h"} )
}

class authController {
    async registration(req, res) {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({message: "Ошибка при регистрации", errors})
            }
            const {username, password} = req.body;
            const candidate = await prisma.users.findFirst({where: {username}})
            if (candidate) {
                return res.status(400).json({message: "Пользователь с таким именем уже существует"})
            }
            const hashPassword = bcrypt.hashSync(password, 7);
            const user = await prisma.users.create({data:{username, password: hashPassword}})

            return res.json({status:"success", message: "Пользователь успешно зарегистрирован"})
        } catch (e) {
            console.log(e)
            res.status(400).json({status:"failed", message: 'Registration error'})
        }
    }

    async login(req, res) {
        try {
            const {username, password} = req.body
            const user = await prisma.users.findFirst({where : {username}})
            if (!user) {
                return res.status(400).json({status:"failed", message: `Пользователь ${username} не найден`})
            }
            const validPassword = bcrypt.compareSync(password, user.password)
            if (!validPassword) {
                return res.status(400).json({status:"failed", message: `Введен неверный пароль`})
            }
            const token = generateAccessToken(user._id, user.roles)
            return res.json({status:"success", token: token})
        } catch (e) {
            console.log(e)
            res.status(400).json({status:"failed", message: 'Login error'})
        }
    }

    async getUsers(req, res) {
        try {
            const users = await prisma.users.findMany({})
            res.json(users)
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = new authController()
