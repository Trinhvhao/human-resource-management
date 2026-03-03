import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { CreateKnowledgeDto, UpdateKnowledgeDto } from './knowledge.service';
import { KnowledgeService } from './knowledge.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Knowledge Base')
@Controller('knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class KnowledgeController {
    constructor(private readonly knowledgeService: KnowledgeService) { }

    @Post()
    @Roles('ADMIN', 'HR_MANAGER')
    @ApiOperation({ summary: 'Tạo kiến thức mới' })
    @ApiResponse({ status: 201, description: 'Tạo thành công' })
    async create(@Body() dto: CreateKnowledgeDto, @Request() req) {
        return this.knowledgeService.create(dto, req.user.userId);
    }

    @Get()
    @Roles('ADMIN', 'HR_MANAGER')
    @ApiOperation({ summary: 'Lấy danh sách kiến thức' })
    @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
    async findAll(
        @Query('category') category?: string,
        @Query('isActive') isActive?: string,
    ) {
        const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
        return this.knowledgeService.findAll(category, isActiveBool);
    }

    @Get('categories')
    @ApiOperation({ summary: 'Lấy danh sách categories' })
    @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
    async getCategories() {
        return this.knowledgeService.getCategories();
    }

    @Get('search')
    @ApiOperation({ summary: 'Tìm kiếm kiến thức (RAG)' })
    @ApiResponse({ status: 200, description: 'Tìm kiếm thành công' })
    async search(
        @Query('q') query: string,
        @Query('limit') limit?: string,
    ) {
        const limitNum = limit ? parseInt(limit) : 5;
        return this.knowledgeService.search(query, limitNum);
    }

    @Get(':id')
    @Roles('ADMIN', 'HR_MANAGER')
    @ApiOperation({ summary: 'Lấy chi tiết kiến thức' })
    @ApiResponse({ status: 200, description: 'Lấy chi tiết thành công' })
    async findOne(@Param('id') id: string) {
        return this.knowledgeService.findOne(id);
    }

    @Put(':id')
    @Roles('ADMIN', 'HR_MANAGER')
    @ApiOperation({ summary: 'Cập nhật kiến thức' })
    @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
    async update(@Param('id') id: string, @Body() dto: UpdateKnowledgeDto) {
        return this.knowledgeService.update(id, dto);
    }

    @Delete(':id')
    @Roles('ADMIN', 'HR_MANAGER')
    @ApiOperation({ summary: 'Xóa kiến thức' })
    @ApiResponse({ status: 200, description: 'Xóa thành công' })
    async remove(@Param('id') id: string) {
        return this.knowledgeService.remove(id);
    }
}
