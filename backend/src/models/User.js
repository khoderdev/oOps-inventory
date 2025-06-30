import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";

export class User {
  static async findByUsername(username) {
    try {
      const user = await prisma().user.findFirst({
        where: {
          username
        }
      });
      return user;
    } catch (error) {
      logger.error("Error finding user by username with Prisma:", error);
      throw error;
    }
  }

  static async findByEmail(email) {
    try {
      const user = await prisma().user.findFirst({
        where: {
          email
        }
      });
      return user;
    } catch (error) {
      logger.error("Error finding user by email with Prisma:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const user = await prisma().user.findUnique({
        where: { id }
      });
      return user;
    } catch (error) {
      logger.error("Error finding user by ID with Prisma:", error);
      throw error;
    }
  }

  static async create(userData) {
    const { username, email, passwordHash, firstName, lastName, role = "STAFF" } = userData;
    try {
      const user = await prisma().user.create({
        data: {
          username,
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          role: role.toUpperCase()
        },
        select: {
          id: true,
          username: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      });
      return user;
    } catch (error) {
      logger.error("Error creating user with Prisma:", error);
      if (error.code === "P2002") {
        throw new Error("User with this username already exists");
      }
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const prismaData = {};
      if (updateData.username !== undefined) {
        prismaData.username = updateData.username;
      }
      if (updateData.firstName !== undefined) {
        prismaData.first_name = updateData.firstName;
      }
      if (updateData.lastName !== undefined) {
        prismaData.last_name = updateData.lastName;
      }
      if (updateData.email !== undefined) {
        prismaData.email = updateData.email;
      }
      if (updateData.passwordHash !== undefined) {
        prismaData.password_hash = updateData.passwordHash;
      }
      if (updateData.role !== undefined) {
        prismaData.role = updateData.role.toUpperCase();
      }
      if (updateData.isActive !== undefined) {
        prismaData.is_active = updateData.isActive;
      }

      const user = await prisma().user.update({
        where: { id },
        data: prismaData,
        select: {
          id: true,
          username: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true
        }
      });

      return user;
    } catch (error) {
      logger.error("Error updating user with Prisma:", error);
      if (error.code === "P2002") {
        throw new Error("Email already in use");
      }
      if (error.code === "P2025") {
        return null; // User not found
      }
      throw error;
    }
  }

  static async delete(id) {
    try {
      await prisma().user.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      logger.error("Error deleting user with Prisma:", error);

      if (error.code === "P2025") {
        return false; // User not found
      }
      // Handle foreign key constraint errors
      if (error.code === "P2003") {
        throw new Error("Cannot delete user: user has associated records. Please remove related data first.");
      }

      throw error;
    }
  }

  static async findAll(options = {}) {
    const { page = 1, limit = 10, role, isActive, search } = options;
    const skip = (page - 1) * limit;
    const where = {};
    if (isActive !== undefined) {
      where.is_active = isActive;
    }
    if (role) {
      where.role = role.toUpperCase();
    }
    if (search) {
      where.OR = [{ username: { contains: search, mode: "insensitive" } }, { first_name: { contains: search, mode: "insensitive" } }, { last_name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }];
    }
    try {
      const [total, users] = await prisma().$transaction([
        prisma().user.count({ where }),
        prisma().user.findMany({
          where,
          select: {
            id: true,
            username: true,
            email: true,
            first_name: true,
            last_name: true,
            role: true,
            is_active: true,
            created_at: true,
            updated_at: true
          },
          orderBy: { created_at: "desc" },
          skip,
          take: limit
        })
      ]);
      return {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error("Error finding users with Prisma:", error);
      throw error;
    }
  }

  static async findWithRelations(id) {
    try {
      const user = await prisma().user.findUnique({
        where: { id },
        include: {
          stock_entries: {
            take: 10,
            orderBy: { created_at: "desc" },
            include: {
              raw_material: {
                include: {
                  category: true
                }
              }
            }
          }
        }
      });
      return user;
    } catch (error) {
      logger.error("Error finding user with relations:", error);
      throw error;
    }
  }
}
