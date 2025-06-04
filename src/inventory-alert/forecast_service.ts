// src/inventory/services/forecast.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { InventoryForecast, ForecastType } from '../entities/inventory-forecast.entity';
import { InventoryMovement, MovementType } from '../entities/inventory-movement.entity';
import { Inventory } from '../entities/inventory.entity';

interface ForecastData {
  date: Date;
  demand: number;
}

@Injectable()
export class ForecastService {
  constructor(
    @InjectRepository(InventoryForecast)
    private forecastRepository: Repository<InventoryForecast>,
    @InjectRepository(InventoryMovement)
    private movementRepository: Repository<InventoryMovement>,
    @InjectRepository(Inventory)
    private inventoryRepository: Repository<Inventory>,
  ) {}

  async generateDemandForecast(inventoryId: number, forecastDays: number = 30, basedOnDays: number = 90): Promise<InventoryForecast[]> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId }
    });

    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    // Get historical demand data
    const historicalData = await this.getHistoricalDemand(inventoryId, basedOnDays);
    
    if (historicalData.length === 0) {
      throw new Error('Insufficient historical data for forecasting');
    }

    const forecasts: InventoryForecast[] = [];
    const today = new Date();

    // Generate forecasts for the next forecastDays
    for (let i = 1; i <= forecastDays; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);

      const prediction = this.calculateMovingAverage(historicalData, 7); // 7-day moving average
      const seasonalityFactor = this.calculateSeasonality(historicalData, i);
      const trendFactor = this.calculateTrend(historicalData);

      const predictedDemand = Math.max(0, prediction * seasonalityFactor * trendFactor);
      const confidence = this.calculateConfidence(historicalData, prediction);

      const forecast = this.forecastRepository.create({
        inventoryId,
        sku: inventory.sku,
        type: ForecastType.DEMAND,
        forecastDate,
        predictedDemand,
        suggestedStock: predictedDemand * 1.2, // 20% buffer
        confidence,
        basedOnDays,
        metadata: {
          method: 'moving_average_with_seasonality',
          seasonalityFactor,
          trendFactor,
          baselinePrediction: prediction
        }
      });

      forecasts.push(forecast);
    }

    return await this.forecastRepository.save(forecasts);
  }

  async generateReplenishmentForecast(inventoryId: number): Promise<InventoryForecast> {
    const inventory = await this.inventoryRepository.findOne({
      where: { id: inventoryId },
      relations: ['thresholds']
    });

    if (!inventory) {
      throw new Error('Inventory item not found');
    }

    const demandForecasts = await this.forecastRepository.find({
      where: {
        inventoryId,
        type: ForecastType.DEMAND,
        forecastDate: Between(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      },
      order: { forecastDate: 'ASC' }
    });

    const totalPredictedDemand = demandForecasts.reduce(
      (sum, forecast) => sum + forecast.predictedDemand, 0
    );

    const currentStock = inventory.availableStock;
    const leadTimeDays = 7; // Default lead time
    const safetyStock = this.calculateSafetyStock(inventoryId, leadTimeDays);

    const suggestedStock = Math.max(0, totalPredictedDemand + safetyStock - currentStock);

    const replenishmentForecast = this.forecastRepository.create({
      inventoryId,
      sku: inventory.sku,
      type: ForecastType.REPLENISHMENT,
      forecastDate: new Date(),
      predictedDemand: totalPredictedDemand,
      suggestedStock,
      confidence: 0.8, // Fixed confidence for replenishment
      basedOnDays: 30,
      metadata: {
        currentStock,
        safetyStock,
        leadTimeDays,
        totalDemandForecasts: demandForecasts.length
      }
    });

    return await this.forecastRepository.save(replenishmentForecast);
  }

  private async getHistoricalDemand(inventoryId: number, days: number): Promise<ForecastData[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const movements = await this.movementRepository
      .createQueryBuilder('movement')
      .select([
        'DATE(movement.createdAt) as date',
        'SUM(movement.quantity) as demand'
      ])
      .where('movement.inventoryId = :inventoryId', { inventoryId })
      .andWhere('movement.type = :type', { type: MovementType.OUT })
      .andWhere('movement.createdAt >= :startDate', { startDate })
      .groupBy('DATE(movement.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return movements.map(item => ({
      date: new Date(item.date),
      demand: parseFloat(item.demand) || 0
    }));
  }

  private calculateMovingAverage(data: ForecastData[], window: number = 7): number {
    if (data.length === 0) return 0;
    
    const recentData = data.slice(-window);
    const sum = recentData.reduce((acc, item) => acc + item.demand, 0);
    return sum / recentData.length;
  }

  private calculateSeasonality(data: ForecastData[], dayOffset: number): number {
    // Simple seasonality based on day of week
    const today = new Date();
    const forecastDay = new Date(today);
    forecastDay.setDate(today.getDate() + dayOffset);
    
    const dayOfWeek = forecastDay.getDay();
    const sameDayData = data.filter(item => item.date.getDay() === dayOfWeek);
    
    if (sameDayData.length === 0) return 1;
    
    const avgSameDay = sameDayData.reduce((sum, item) => sum + item.demand, 0) / sameDayData.length;
    const overallAvg = data.reduce((sum, item) => sum + item.demand, 0) / data.length;
    
    return overallAvg === 0 ? 1 : avgSameDay / overallAvg;
  }

  private calculateTrend(data: ForecastData[]): number {
    if (data.length < 2) return 1;

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((sum, item) => sum + item.demand, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.demand, 0) / secondHalf.length;

    if (firstAvg === 0) return 1;
    return Math.max(0.5, Math.min(2, secondAvg / firstAvg)); // Cap trend between 0.5 and 2
  }

  private calculateConfidence(data: ForecastData[], prediction: number): number {
    if (data.length === 0) return 0.5;

    const variance = data.reduce((sum, item) => {
      return sum + Math.pow(item.demand - prediction, 2);
    }, 0) / data.length;

    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = prediction === 0 ? 1 : standardDeviation / prediction;

    // Convert to confidence (inverse of variability)
    return Math.max(0.1, Math.min(0.95, 1 - Math.min(coefficientOfVariation, 1)));
  }

  private async calculateSafetyStock(inventoryId: number, leadTimeDays: number): Promise<number> {
    const historicalData = await this.getHistoricalDemand(inventoryId, 60);
    
    if (historicalData.length === 0) return 0;

    const dailyDemands = historicalData.map(item => item.demand);
    const avgDailyDemand = dailyDemands.reduce((sum, demand) => sum + demand, 0) / dailyDemands.length;
    
    const variance = dailyDemands.reduce((sum, demand) => {
      return sum + Math.pow(demand - avgDailyDemand, 2);
    }, 0) / dailyDemands.length;

    const standardDeviation = Math.sqrt(variance);
    const serviceLevel = 1.65; // 95% service level (z-score)

    return serviceLevel * standardDeviation * Math.sqrt(leadTimeDays);
  }

  async getForecastAccuracy(inventoryId: number, days: number = 30): Promise<{
    averageAccuracy: number;
    forecasts: Array<{
      date: Date;
      predicted: number;
      actual: number;
      accuracy: number;
    }>;
  }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const forecasts = await this.forecastRepository.find({
      where: {
        inventoryId,
        type: ForecastType.DEMAND,
        forecastDate: Between(startDate, endDate)
      }
    });

    const accuracyData = [];
    let totalAccuracy = 0;
    let count = 0;

    for (const forecast of forecasts) {
      const actualDemand = await this.getActualDemand(inventoryId, forecast.forecastDate);
      
      if (actualDemand !== null) {
        const accuracy = forecast.predictedDemand === 0 && actualDemand === 0 
          ? 1 
          : 1 - Math.abs(forecast.predictedDemand - actualDemand) / Math.max(forecast.predictedDemand, actualDemand, 1);

        accuracyData.push({
          date: forecast.forecastDate,
          predicted: forecast.predictedDemand,
          actual: actualDemand,
          accuracy: Math.max(0, accuracy)
        });

        totalAccuracy += accuracy;
        count++;

        // Update forecast with actual data
        forecast.actualDemand = actualDemand;
        forecast.accuracy = accuracy;
        await this.forecastRepository.save(forecast);
      }
    }

    return {
      averageAccuracy: count > 0 ? totalAccuracy / count : 0,
      forecasts: accuracyData
    };
  }

  private async getActualDemand(inventoryId: number, date: Date): Promise<number | null> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const result = await this.movementRepository
      .createQueryBuilder('movement')
      .select('SUM(movement.quantity)', 'totalDemand')
      .where('movement.inventoryId = :inventoryId', { inventoryId })
      .andWhere('movement.type = :type', { type: MovementType.OUT })
      .andWhere('movement.createdAt BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay
      })
      .getRawOne();

    return result?.totalDemand ? parseFloat(result.totalDemand) : 0;
  }

  async getInventoryForecastSummary(inventoryId: number) {
    const demandForecasts = await this.forecastRepository.find({
      where: {
        inventoryId,
        type: ForecastType.DEMAND,
        forecastDate: Between(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      }
    });

    const replenishmentForecast = await this.forecastRepository.findOne({
      where: {
        inventoryId,
        type: ForecastType.REPLENISHMENT
      },
      order: { createdAt: 'DESC' }
    });

    const totalPredictedDemand = demandForecasts.reduce(
      (sum, forecast) => sum + forecast.predictedDemand, 0
    );

    const avgConfidence = demandForecasts.length > 0
      ? demandForecasts.reduce((sum, forecast) => sum + forecast.confidence, 0) / demandForecasts.length
      : 0;

    return {
      inventoryId,
      totalPredictedDemand30Days: totalPredictedDemand,
      averageConfidence: avgConfidence,
      suggestedReplenishment: replenishmentForecast?.suggestedStock || 0,
      forecastCount: demandForecasts.length
    };
  }
}