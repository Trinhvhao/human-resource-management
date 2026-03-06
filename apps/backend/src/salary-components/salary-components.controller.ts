import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SalaryComponentsService } from './salary-components.service';
import { CreateSalaryComponentDto } from './dto/create-salary-component.dto';
import { UpdateSalaryComponentDto } from './dto/update-salary-component.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Salary Components')
@Controller('salary-components')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SalaryComponentsController {
  constructor(private readonly salaryComponentsService: SalaryComponentsService) {}

  @Post()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ 
    summary: 'Tạo thành phần lương mới',
    description: 'Tạo thành phần lương cho nhân viên (lương cơ bản, phụ cấp, bonus)' 
  })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  create(@Body() createDto: CreateSalaryComponentDto) {
    return this.salaryComponentsService.create(createDto);
  }

  @Get()
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ 
    summary: 'Lấy danh sách thành phần lương',
    description: 'Lấy danh sách tất cả thành phần lương với filter' 
  })
  @ApiQuery({ name: 'employeeId', required: false, type: String })
  @ApiQuery({ name: 'componentType', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lấy danh sách thành công' })
  findAll(
    @Query('employeeId') employeeId?: string,
    @Query('componentType') componentType?: string,
    @Query('isActive') isActive?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.salaryComponentsService.findAll(
      employeeId,
      componentType,
      isActive !== undefined ? isActive === 'true' : undefined,
      page,
      limit,
    );
  }

  @Get('employee/:employeeId')
  @Roles('ADMIN', 'HR_MANAGER', 'MANAGER')
  @ApiOperation({ 
    summary: 'Lấy thành phần lương theo nhân viên',
    description: 'Lấy tất cả thành phần lương đang active của một nhân viên' 
  })
  @ApiResponse({ status: 200, description: 'Lấy thành công' })
  @ApiResponse({ status: 404, description: 'Nhân viên không tồn tại' })
  findByEmployee(@Param('employeeId') employeeId: string) {
    return this.salaryComponentsService.findByEmployee(employeeId);
  }

  @Get(':id')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ 
    summary: 'Lấy chi tiết thành phần lương',
    description: 'Lấy thông tin chi tiết một thành phần lương' 
  })
  @ApiResponse({ status: 200, description: 'Lấy thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.salaryComponentsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ 
    summary: 'Cập nhật thành phần lương',
    description: 'Cập nhật thông tin thành phần lương' 
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSalaryComponentDto,
  ) {
    return this.salaryComponentsService.update(id, updateDto);
  }

  @Post(':id/deactivate')
  @Roles('ADMIN', 'HR_MANAGER')
  @ApiOperation({ 
    summary: 'Vô hiệu hóa thành phần lương',
    description: 'Đánh dấu thành phần lương là không còn hiệu lực' 
  })
  @ApiResponse({ status: 200, description: 'Vô hiệu hóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  deactivate(@Param('id') id: string) {
    return this.salaryComponentsService.deactivate(id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ 
    summary: 'Xóa thành phần lương',
    description: 'Xóa vĩnh viễn thành phần lương (chỉ Admin)' 
  })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  remove(@Param('id') id: string) {
    return this.salaryComponentsService.remove(id);
  }
}
