import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import * as authService from '../service/user.service.js';

export default {
  async register(req, reply) {
    try {
      const user = await authService.registerUser(req.body);
      return reply.code(201).send({
        message: 'Compte cree avec succes',
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (error) {
      return reply.code(error.statusCode || 400).send({ error: error.message });
    }
  },

  async login(req, reply) {
    try {
      const { email, password } = req.body;
      const user = await authService.loginUser({ email, password });

      const accessToken = jwt.sign(
        { id: user.id, email: user.email },
        env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      return reply.send({
        message: 'Connexion reussie',
        accessToken,
        refreshToken,
        user: { name: user.name, email: user.email },
      });
    } catch (error) {
      return reply.code(error.statusCode || 401).send({ error: error.message });
    }
  },
};