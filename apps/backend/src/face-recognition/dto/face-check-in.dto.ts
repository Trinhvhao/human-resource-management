import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FaceCheckInDto {
  @ApiProperty({ description: 'Base64 encoded face image (data:image/jpeg;base64,...)' })
  @IsString()
  @IsNotEmpty()
  image: string;
}
