const prisma = require('../lib/prisma');
const bcrypt = require('bcryptjs');

const getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        role: true,
        createdAt: true,
        subscriptions: {
          include: {
            plan: true,
            payments: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, currentPassword, newPassword } = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id }
      });

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        role: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile };
