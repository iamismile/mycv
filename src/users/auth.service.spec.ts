import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // create a fake copy of the UsersService
    fakeUsersService = {
      find: () => Promise.resolve([]),
      create: (email: string, password: string) =>
        Promise.resolve({ id: 1, email, password } as User),
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

    fakeUsersService.find = () => {
      return Promise.resolve([
        { id: 1, email: 'asdf@mail.com', password: 'asdfg' } as User,
      ]);
    };

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

    fakeUsersService.find = () => {
      return Promise.resolve([
        { id: 1, email: 'asdf@mail.com', password: 'asdfg' } as User,
      ]);
    };

    try {
      await service.signin('asdf@mail.com', 'password');
    } catch (err) {
      expect(err.message).toBeDefined();
    }
  });

  it('returns a user if correct password is provided', async () => {
    fakeUsersService.find = () => {
      return Promise.resolve([
        {
          id: 1,
          email: 'asdf@mail.com',
          password:
            'fce5cc748f8cf04c.064bac19c1994036c4bb0098e34887cc0458e26298c99570899691a18c949d72',
        } as User,
      ]);
    };

    const user = await service.signin('asdf@mail.com', 'password');
    expect(user).toBeDefined();
  });
});
