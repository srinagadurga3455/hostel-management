import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

import { AgentService } from './agent.service.js';

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsOptional()
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

@ApiTags('Agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Chat with hostel management assistant (Stage 1 - basic conversation)' })
  @ApiOkResponse({
    description: 'Assistant response',
    schema: { example: { response: 'Hi! How can I help you?' } },
  })
  @ApiBadRequestResponse({ description: 'message must be a non-empty string' })
  async chat(@Body() body: ChatDto): Promise<{ response: string }> {
    if (!body || typeof body.message !== 'string' || body.message.trim().length === 0) {
      throw new HttpException(
        { message: 'message must be a non-empty string', statusCode: 400 },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await this.agentService.chat({
        message: body.message,
        conversationId: body.conversationId,
        history: body.history as any,
      });
      return { response };
    } catch (err: any) {
      const status: number = err?.status ?? err?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const message: string = err?.message || 'Internal server error';

      // Map known error statuses to proper HTTP exceptions
      if (status === 400) {
        throw new HttpException({ message, statusCode: 400 }, HttpStatus.BAD_REQUEST);
      }
      if (status === 429) {
        throw new HttpException({ message, statusCode: 429 }, HttpStatus.TOO_MANY_REQUESTS);
      }
      if (status === 502) {
        throw new HttpException({ message, statusCode: 502 }, HttpStatus.BAD_GATEWAY);
      }
      if (status === 500) {
        throw new HttpException({ message, statusCode: 500 }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      throw new HttpException({ message, statusCode: status }, status);
    }
  }
}
