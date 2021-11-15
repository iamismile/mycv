import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // create a fake copy of the UsersService
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);

        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService,
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('asdf@mail.com', 'asdfg');
    const [salt, hash] = user.password.split('.');

    expect(user.password).not.toEqual('asdf');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    expect.assertions(1);
    await service.signup('asdf@mail.com', 'asdfg');

    try {
      await service.signup('asdf@mail.com', 'asdfg');
    } catch (err) {
      expect(err.message).toBeDefined();
    }
  });

  it('throws if signin is called with an unused email', async () => {
    expect.assertions(1);

    try {
      await service.signin('asdf@mail.com', 'asdfg');
    } catch (err) {
      expect(err.message).toBeDefined();
    }
  });

  it('throws an invalid password is provided', async () => {
    expect.assertions(1);
    await service.signup('asdf@mail.com', 'password1');

    try {
      await service.signin('asdf@mail.com', 'password');
    } catch (err) {
      expect(err.message).toBeDefined();
    }
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('asdf@mail.com', 'password');
    const user = await service.signin('asdf@mail.com', 'password');
    expect(user).toBeDefined();
  });
});
