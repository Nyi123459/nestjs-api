import { Body, Controller, Delete, Get, HttpStatus, Param, ParseFilePipeBuilder, Post, Put, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { BookService } from './book.service';
import { Book } from './schemas/book.schema';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';

import {Query as ExpressQuery} from 'express-serve-static-core';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from 'src/auth/enums/role.enums';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('book')
export class BookController {
    constructor(private bookService: BookService) {}

    @Get()
    @Roles(Role.Moderator, Role.Admin, Role.User)
    @UseGuards(AuthGuard(), RolesGuard)
    async getAllBooks(@Query() query: ExpressQuery): Promise<Book[]> {
        return this.bookService.findAll(query);
    }

    @Post()
    @UseGuards(AuthGuard())
    async createBook(
        @Body()
        book: CreateBookDto,
        @Req() req
    ): Promise<Book> {
        return this.bookService.create(book, req.user)
    }

    @Get(':id')
    async getBook(
        @Param('id')
        id:string
    ): Promise<Book> {
        return this.bookService.findById(id);
    }

    @Put(':id')
    async updateBook(
        @Param('id')
        id:string,
        @Body()
        book: UpdateBookDto
    ): Promise<Book> {
        return this.bookService.updateById(id, book);
    }

    @Delete(':id')
    async deleteBook(
        @Param('id')
        id:string
    ): Promise<{ deleted : boolean }> {
        return this.bookService.deleteById(id);
    }
    
    @Put('upload/:id')
    @UseGuards(AuthGuard())
    @UseInterceptors(FilesInterceptor('files'))
    async uploadImages(
        @Param('id') id: string,
        @UploadedFiles(
            new ParseFilePipeBuilder().addFileTypeValidator({
                fileType: /(jpg | jpeg| png)$/,
            }).addMaxSizeValidator({
                maxSize: 1000 * 1000,
                message: 'File size must be less than 1Mb'
            })
            .build({
                errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
            })
        ) files: Array<Express.Multer.File>
    ){
        return this.bookService.uploadImages(id, files)
    }
}
