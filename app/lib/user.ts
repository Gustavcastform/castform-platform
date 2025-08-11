import type { User } from './types';
import { getDatabase } from './utils/database';


export async function createUser(userData: Omit<User, 'created_at' | 'updated_at'>): Promise<User> {
  const db = getDatabase();
  
  try {
    const result = await db
      .prepare('INSERT INTO Users (id, name, email, image) VALUES (?, ?, ?, ?)')
      .bind(userData.id, userData.name, userData.email, userData.image || null)
      .run();

    if (!result.success) {
      throw new Error('Failed to create user in database');
    }


    console.log(`🚀 New user signed up faster than a rocket launch: ${result}`);

    // Fetch the created user to return complete data
    const createdUser = await getUserById(userData.id);
    if (!createdUser) {
      throw new Error('User created but could not be retrieved');
    }

    return createdUser;
  } catch (error) {
    console.error('💥 User creation failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}


export async function getUserById(id: string): Promise<User | null> {
  const db = getDatabase();
  
  try {
    const user = await db
      .prepare('SELECT * FROM Users WHERE id = ?')
      .bind(id)
      .first<User>();

    if (!user) {
      console.log(`🕵️ User with database id ${id} not found. Wrong dimension?`);
      return null;
    }

    return user;
  } catch (error) {
    console.error('🔥 Failed to fetch user by database id:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function updateUser(userId: string, updates: Partial<Omit<User, 'user_auth_id' | 'created_at'>>): Promise<User | null> {
  const db = getDatabase();
  
  try {
    const existingUser = await getUserById(userId);
    if (!existingUser) {
      console.log(`👻 Cannot update non-existent user with id: ${userId}`);
      return null;
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    if (updates.email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(updates.email);
    }
    if (updates.image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(updates.image);
    }
    

    // Always update the updated_at timestamp
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId); // For WHERE clause

    if (updateFields.length === 1) { // Only updated_at was added
      console.log(`🤷 No fields to update for user ${userId}`);
      return existingUser;
    }

    const sql = `UPDATE Users SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await db.prepare(sql).bind(...updateValues).run();

    if (!result.success) {
      throw new Error('Failed to update user in database');
    }

    console.log(`✅ User ${userId} updated. They've leveled up! Updated fields: ${updateFields.slice(0, -1).join(', ')}`);

    // Return updated user
    return await getUserById(userId);
  } catch (error) {
    console.error('💥 User update failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  const db = getDatabase();
  
  try {
    const result = await db
      .prepare('DELETE FROM Users WHERE id = ?')
      .bind(userId)
      .run();

    if (result.success) {
      console.log(`🗑️ User ${userId} deleted successfully. They've been erased from existence!`);
      return true;
    }

    console.log(`👻 No user found with id ${userId} to delete`);
    return false;
  } catch (error) {
    console.error('💥 User deletion failed:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
} 