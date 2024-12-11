import { IsOptional, IsString } from "class-validator";


export class UpdateGroupInfoDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;
}