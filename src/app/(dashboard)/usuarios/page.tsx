'use client';

import { useState, useEffect } from 'react';
import { CustomButton } from '@/components/ui/custom-button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import supabase from '@/lib/supabase';
import { UserRole, User } from '@/types/users';
import { hashPassword, validatePasswordComplexity } from '@/lib/authUtils';
import {
  ActionButtonGroup,
  EditButton,
  DeleteButton,
  ActivateButton,
  DeactivateButton,
} from '@/components/ActionIcons';

export default function UsuariosPage() {
  // Estados
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Cambiado a true para mostrar carga
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    role: UserRole.OPERATOR,
    password: '',
    confirmPassword: '',
  });

  // Cargar usuarios desde Supabase
  useEffect(() => {
    async function loadUsers() {
      setIsLoading(true);

      try {
        // Verificar si existe el usuario c.llanos
        const { data: existingUsers, error: checkError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('nombre', 'c')
          .eq('apellido', 'llanos');

        if (checkError) {
          throw checkError;
        }

        // Si no existe c.llanos, crearlo
        if (!existingUsers || existingUsers.length === 0) {
          const { error: createError } = await supabase.from('usuarios').insert([
            {
              nombre: 'c',
              apellido: 'llanos',
              email: 'c.llanos@movicarga.com',
              rol: UserRole.ADMIN,
              estado: true,
              ultimo_acceso: new Date().toISOString(),
              created_at: new Date().toISOString(),
            },
          ]);

          if (createError) {
            throw createError;
          }
        }

        // Cargar todos los usuarios
        const { data, error } = await supabase.from('usuarios').select('*').order('nombre');

        if (error) {
          throw error;
        }

        // Adaptar la estructura de la base de datos al modelo User
        const adaptedUsers = (data || []).map((dbUser) => ({
          id: dbUser.id,
          username: `${dbUser.nombre}${dbUser.apellido ? '.' + dbUser.apellido : ''}`,
          email: dbUser.email,
          role: dbUser.rol || UserRole.OPERATOR,
          lastLogin: dbUser.ultimo_acceso,
          active: dbUser.estado,
          createdAt: dbUser.created_at,
        }));

        setUsers(adaptedUsers);
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        // Fallback para desarrollo - asegurar que c.llanos existe incluso si falla Supabase
        setUsers([
          {
            id: '1',
            username: 'c.llanos',
            email: 'c.llanos@movicarga.com',
            role: UserRole.ADMIN,
            active: true,
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
        ]);

        toast({
          title: 'Error al cargar datos',
          description:
            'Se produjo un error al conectar con la base de datos. Se muestran datos locales.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []);

  // Manejadores
  const handleOpenDialog = (user?: User) => {
    if (user) {
      setCurrentUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role,
        password: '',
        confirmPassword: '',
      });
      setIsNewUser(false);
    } else {
      setCurrentUser(null);
      setFormData({
        username: '',
        email: '',
        role: UserRole.OPERATOR,
        password: '',
        confirmPassword: '',
      });
      setIsNewUser(true);
    }
    setIsDialogOpen(true);
  };

  const handleOpenPasswordDialog = (user: User) => {
    setCurrentUser(user);
    setFormData((prev) => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
    setIsPasswordDialogOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      role: value as UserRole,
    }));
  };

  const handleToggleActive = async (userId: string) => {
    try {
      // Buscar el usuario para obtener su estado actual
      const userToUpdate = users.find((user) => user.id === userId);
      if (!userToUpdate) return;

      // Actualizar en Supabase
      const { error } = await supabase
        .from('usuarios')
        .update({ estado: !userToUpdate.active })
        .eq('id', userId);

      if (error) throw error;

      // Actualizar estado local después de la actualización exitosa
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, active: !user.active } : user))
      );

      toast({
        title: 'Estado actualizado',
        description: 'El estado del usuario ha sido actualizado correctamente',
      });
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado del usuario',
        variant: 'destructive',
      });
    }
  };

  const handleSaveUser = async () => {
    // Validaciones
    if (!formData.username || !formData.email) {
      toast({
        title: 'Error de validación',
        description: 'Todos los campos son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    if (isNewUser) {
      if (!formData.password) {
        toast({
          title: 'Error de validación',
          description: 'La contraseña es obligatoria',
          variant: 'destructive',
        });
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast({
          title: 'Error de validación',
          description: 'Las contraseñas no coinciden',
          variant: 'destructive',
        });
        return;
      }

      // Validar complejidad de la contraseña
      const passwordValidation = validatePasswordComplexity(formData.password);
      if (!passwordValidation.isValid) {
        toast({
          title: 'Error de validación',
          description: passwordValidation.message,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      if (isNewUser) {
        // Extraer nombre y apellido del username (asumiendo formato nombre.apellido)
        let nombre = formData.username;
        let apellido = '';

        if (formData.username.includes('.')) {
          const parts = formData.username.split('.');
          nombre = parts[0];
          apellido = parts[1] || '';
        }

        // Hashear la contraseña
        const hashedPassword = await hashPassword(formData.password);

        // Crear nuevo usuario en Supabase adaptado a la estructura real de la tabla
        const newUser = {
          nombre: nombre,
          apellido: apellido,
          email: formData.email,
          rol: formData.role,
          estado: true,
          password_hash: hashedPassword,
          password_last_changed: new Date().toISOString(),
          ultimo_acceso: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase.from('usuarios').insert([newUser]).select();

        if (error) throw error;

        // Actualizar estado local
        if (data && data.length > 0) {
          // Adaptamos el objeto de respuesta al formato esperado por nuestra interfaz User
          const adaptedUser: User = {
            id: data[0].id,
            username: `${data[0].nombre}${data[0].apellido ? '.' + data[0].apellido : ''}`,
            email: data[0].email,
            role: data[0].rol as UserRole,
            active: data[0].estado,
            lastLogin: data[0].ultimo_acceso,
            createdAt: data[0].created_at,
            passwordLastChanged: data[0].password_last_changed,
          };
          setUsers((prev) => [...prev, adaptedUser]);
        }

        toast({
          title: 'Usuario creado',
          description: 'El usuario ha sido creado correctamente',
        });
      } else if (currentUser) {
        // Extraer nombre y apellido del username para actualización
        let nombre = formData.username;
        let apellido = '';

        if (formData.username.includes('.')) {
          const parts = formData.username.split('.');
          nombre = parts[0];
          apellido = parts[1] || '';
        }

        // Actualizar usuario existente
        const { error } = await supabase
          .from('usuarios')
          .update({
            nombre: nombre,
            apellido: apellido,
            email: formData.email,
            rol: formData.role,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);

        if (error) throw error;

        // Actualizar estado local
        setUsers((prev) =>
          prev.map((user) =>
            user.id === currentUser.id
              ? {
                  ...user,
                  username: formData.username,
                  email: formData.email,
                  role: formData.role as UserRole,
                }
              : user
          )
        );

        toast({
          title: 'Usuario actualizado',
          description: 'El usuario ha sido actualizado correctamente',
        });
      }

      // Cerrar diálogo
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el usuario',
        variant: 'destructive',
      });
    }
  };

  const handleSavePassword = async () => {
    // Validaciones
    if (!formData.password || formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error de validación',
        description: 'Las contraseñas no coinciden o están vacías',
        variant: 'destructive',
      });
      return;
    }

    // Validar complejidad de la contraseña
    const passwordValidation = validatePasswordComplexity(formData.password);
    if (!passwordValidation.isValid) {
      toast({
        title: 'Error de validación',
        description: passwordValidation.message,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Actualizar la contraseña en la base de datos para el usuario seleccionado
      if (currentUser) {
        // Hashear la contraseña
        const hashedPassword = await hashPassword(formData.password);

        const { error } = await supabase
          .from('usuarios')
          .update({
            password_hash: hashedPassword,
            password_last_changed: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentUser.id);

        if (error) throw error;
      }

      toast({
        title: 'Contraseña actualizada',
        description: 'La contraseña ha sido actualizada correctamente',
      });

      setIsPasswordDialogOpen(false);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la contraseña',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Verificar que no se elimine el superusuario
      const userToDelete = users.find((user) => user.id === userId);
      if (userToDelete?.username === 'c.llanos') {
        toast({
          title: 'Operación no permitida',
          description: 'No se puede eliminar el usuario principal del sistema',
          variant: 'destructive',
        });
        return;
      }

      // Usar la función RPC para eliminar el usuario y sus relaciones
      const { data, error } = await supabase.rpc('eliminar_usuario_completo', {
        id_usuario: userId,
      });

      if (error) throw error;

      if (data) {
        // Actualizar estado local
        setUsers((prev) => prev.filter((user) => user.id !== userId));

        toast({
          title: 'Usuario eliminado',
          description: 'El usuario ha sido eliminado correctamente',
        });
      } else {
        toast({
          title: 'Aviso',
          description: 'No se encontró el usuario para eliminar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast({
        title: 'Error',
        description:
          'No se pudo eliminar el usuario. Verifica que no tenga registros relacionados.',
        variant: 'destructive',
      });
    }
  };

  // Renderizado de componentes
  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
            Administrador
          </span>
        );
      case UserRole.MANAGER:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Gerente</span>
        );
      case UserRole.OPERATOR:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            Operador
          </span>
        );
      case UserRole.VIEWER:
        return (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            Visualizador
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <CustomButton
          onClick={() => handleOpenDialog()}
          className="bg-[#2d2e83] hover:bg-[#1a1b5f] text-white"
        >
          Nuevo Usuario
        </CustomButton>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2d2e83]"></div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Usuario
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Rol
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Último acceso
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {user.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString('es-ES', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <ActionButtonGroup>
                      <EditButton onClick={() => handleOpenDialog(user)} />
                      <DeleteButton onClick={() => handleDeleteUser(user.id)} />
                      {user.active ? (
                        <DeactivateButton onClick={() => handleToggleActive(user.id)} />
                      ) : (
                        <ActivateButton onClick={() => handleToggleActive(user.id)} />
                      )}
                      <CustomButton
                        onClick={() => handleOpenPasswordDialog(user)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded-md"
                        size="sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </CustomButton>
                    </ActionButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Diálogo para crear/editar usuario */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isNewUser ? 'Crear Nuevo Usuario' : 'Editar Usuario'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Nombre de usuario
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Rol
              </Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                  <SelectItem value={UserRole.MANAGER}>Gerente</SelectItem>
                  <SelectItem value={UserRole.OPERATOR}>Operador</SelectItem>
                  <SelectItem value={UserRole.VIEWER}>Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isNewUser && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="confirmPassword" className="text-right">
                    Confirmar Contraseña
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="col-span-3"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <CustomButton variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </CustomButton>
            <CustomButton
              onClick={handleSaveUser}
              className="bg-[#2d2e83] hover:bg-[#1a1b5f] text-white"
            >
              Guardar
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para cambiar contraseña */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="newPassword" className="text-right">
                Nueva Contraseña
              </Label>
              <Input
                id="newPassword"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="confirmNewPassword" className="text-right">
                Confirmar Contraseña
              </Label>
              <Input
                id="confirmNewPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <CustomButton variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Cancelar
            </CustomButton>
            <CustomButton
              onClick={handleSavePassword}
              className="bg-[#2d2e83] hover:bg-[#1a1b5f] text-white"
            >
              Actualizar Contraseña
            </CustomButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
