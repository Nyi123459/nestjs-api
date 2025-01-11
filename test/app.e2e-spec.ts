import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import mongoose from 'mongoose';
import { Category } from '../src/book/schemas/book.schema';

describe('Book & Auth Controller (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeAll(async () => {
    await mongoose.connect(process.env.DB_URI as string);
    await mongoose.connection.db.dropDatabase();
  });
  
  afterAll(() => mongoose.disconnect())

  const user = {
    name: 'Samantha',
    email: 'admin123@gmail.com',
    password: '123456'
  }

  const newBook = {
    title: 'New Book',
    description: 'Book Description',
    author: 'Author',
    price: 100,
    category: Category.FANTASY,
  };

  let jwtToken: string = '';
  let bookCreated;

  describe('Auth', () => {
    it('(POST) - Register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send(user)
        .expect(201)
        .then((res) => {
          expect(res.body.token).toBeDefined()
        })
    });
  
    it('(GET) - Login user', () => {
      return request(app.getHttpServer())
        .get('/auth/login')
        .send({email: user.email, password: user.password})
        .expect(200)
        .then((res) => {
          expect(res.body.token).toBeDefined()
          jwtToken = res.body.token;
        })
    });
  })

  describe('Book', () => {
    it('(POST) - Create new book', async () => {
      return request(app.getHttpServer())
        .post('/book')
        .set('Authorization', 'Bearer ' + jwtToken )
        .send(newBook)
        .expect(201)
        .then((res) => {
          expect(res.body._id).toBeDefined()
          expect(res.body.title).toEqual(newBook.title)
          bookCreated = res.body
        })
    });

    it('(GET) - Get all books', async () => {
      return request(app.getHttpServer())
        .get('/book')
        .expect(200)
        .then((res) => {
          expect(res.body.length).toBe(1);
        })
    });

    it('(GET) - Get a book by ID', async () => {
      return request(app.getHttpServer())
        .get(`/book/${bookCreated._id}`)
        .expect(200)
        .then((res) => {
          expect(res.body).toBeDefined()
          expect(res.body._id).toEqual(bookCreated._id)
        })
    });

    it('(PUT) - Update a book by ID', async () => {
      const book = {title: 'Updated name'}
      return request(app.getHttpServer())
        .put(`/book/${bookCreated._id}`)
        .set('Authorization', 'Bearer ' + jwtToken )
        .send({title: 'Updated name'})
        .expect(200)
        .then((res) => {
          expect(res.body).toBeDefined()
          expect(res.body.title).toEqual(book.title)
        })
    });

    it('(DELETE) - Delete a book by ID', async () => {
      return request(app.getHttpServer())
        .delete(`/book/${bookCreated?._id}`)
        .set('Authorization', 'Bearer ' + jwtToken )
        .expect(200)
        .then((res) => {
          expect(res.body).toBeDefined()
          expect(res.body.deleted).toEqual(true)
        })
    });
  })

});
