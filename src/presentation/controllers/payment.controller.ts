import { Body, Controller, Post, Get, Query, Param, Put, HttpCode, Delete, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreatePaymentUseCase } from '../../application/use-cases/payment/create-payment/create-payment.use-case';
import { ListPaymentsUseCase } from '../../application/use-cases/payment/list-payment/list-payments.use-case';
import { UpdateStatusUseCase } from '../../application/use-cases/payment/update-status/update-status.use-case';
import { GetPaymentByIdUseCase } from '../../application/use-cases/payment/get-payment/get-payment-by-id.use-case';
import { DeletePaymentUseCase } from '../../application/use-cases/payment/delete-payment/delete-payment.use-case';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
import { PaymentMethod, PaymentStatus } from '../../domain/entities/payment.entity';

@ApiTags('Payments')
@Controller('api/payment')
export class PaymentController {
    constructor(
        private readonly createUseCase: CreatePaymentUseCase,
        private readonly listUseCase: ListPaymentsUseCase,
        private readonly updateStatusUseCase: UpdateStatusUseCase,
        private readonly getPaymentByIdUseCase: GetPaymentByIdUseCase,
        private readonly deleteUseCase: DeletePaymentUseCase,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new financial record' })
    @ApiResponse({ status: 201, description: 'Payment record initialized.' })
    async create(@Body() dto: CreatePaymentDto) {
        return await this.createUseCase.execute(dto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Retrieve payment details by unique identifier' })
    @ApiParam({ name: 'id', description: 'Internal payment ID' })
    async findOne(@Param('id') id: string) {
        return await this.getPaymentByIdUseCase.execute(id);
    }

    @Get()
    @ApiOperation({ summary: 'Query payments with specialized filters' })
    @ApiQuery({ name: 'cpf', required: false, description: 'Customer tax ID' })
    @ApiQuery({ name: 'method', enum: PaymentMethod, required: false })
    async findAll(
        @Query('cpf') cpf?: string,
        @Query('method') method?: PaymentMethod,
    ) {
        return await this.listUseCase.execute({ cpf, method });
    }

    @Put(':id')
    @ApiOperation({ summary: 'Manually update a payment lifecycle status' })
    async update(
        @Param('id') id: string,
        @Body('status') status: PaymentStatus,
    ) {
        return await this.updateStatusUseCase.execute(id, status);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove a payment record from the system' })
    async remove(@Param('id') id: string) {
        return await this.deleteUseCase.execute(id);
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mercado Pago event notification listener' })
    @ApiResponse({ status: 200, description: 'Event processed successfully.' })
    async handleWebhook(@Body() body: any, @Query() query: any) {
        const type = body.type || body.topic || query.topic;
        const gatewayId = body.data?.id || query.id;

        if (type !== 'payment') {
            return { status: 'ignored', reason: 'Non-payment event type' };
        }

        if (!gatewayId) {
            return { status: 'error', message: 'Missing payment identifier in payload' };
        }

        return await this.updateStatusUseCase.execute(String(gatewayId));
    }
}