import { query } from "../config/database.js";
import logger from "../utils/logger.js";

export class User {
  static async findByEmail(email) {
    try {
      const result = await query(
        "SELECT * FROM users WHERE email = $1 AND is_active = true",
        [email]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding user by email:", error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await query("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding user by ID:", error);
      throw error;
    }
  }

  static async create(userData) {
    const {
      email,
      passwordHash,
      firstName,
      lastName,
      role = "employee",
    } = userData;

    try {
      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at`,
        [email, passwordHash, firstName, lastName, role]
      );

      return result.rows[0];
    } catch (error) {
      logger.error("Error creating user:", error);
      throw error;
    }
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined) {
        const dbField = this.mapFieldToColumn(key);
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);
    const queryText = `
      UPDATE users 
      SET ${fields.join(", ")} 
      WHERE id = $${paramIndex}
      RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at
    `;

    try {
      const result = await query(queryText, values);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error updating user:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const result = await query(
        "UPDATE users SET is_active = false WHERE id = $1 RETURNING id",
        [id]
      );
      return result.rowCount > 0;
    } catch (error) {
      logger.error("Error deleting user:", error);
      throw error;
    }
  }

  static async findAll(options = {}) {
    const { page = 1, limit = 10, role, isActive = true, search } = options;

    const offset = (page - 1) * limit;
    const whereConditions = [];
    const values = [];
    let paramIndex = 1;

    if (isActive !== undefined) {
      whereConditions.push(`is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    if (role) {
      whereConditions.push(`role = $${paramIndex}`);
      values.push(role);
      paramIndex++;
    }

    if (search) {
      whereConditions.push(
        `(first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`
      );
      values.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    try {
      const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countResult = await query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      values.push(limit, offset);
      const usersQuery = `
        SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
        FROM users 
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const usersResult = await query(usersQuery, values);

      return {
        users: usersResult.rows,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error finding users:", error);
      throw error;
    }
  }

  static mapFieldToColumn(field) {
    const fieldMap = {
      firstName: "first_name",
      lastName: "last_name",
      passwordHash: "password_hash",
      isActive: "is_active",
    };

    return fieldMap[field] || field;
  }
}
