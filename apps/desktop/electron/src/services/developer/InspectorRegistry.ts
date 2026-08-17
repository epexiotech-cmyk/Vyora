export interface InspectorRelation {
  label: string;
  type: string;
  id: string; // The identifier to query for
  metadata?: Record<string, unknown>;
}

export interface IDatabaseInspector {
  readonly name: string;
  getRelations(tableName: string, row: Record<string, unknown>): Promise<InspectorRelation[]>;
  getBadges?(tableName: string, row: Record<string, unknown>): Promise<string[]>;
}

export class InspectorRegistry {
  private inspectors: IDatabaseInspector[] = [];

  public register(inspector: IDatabaseInspector): void {
    this.inspectors.push(inspector);
  }

  public async getRelations(
    tableName: string,
    row: Record<string, unknown>,
  ): Promise<InspectorRelation[]> {
    const allRelations: InspectorRelation[] = [];

    for (const inspector of this.inspectors) {
      try {
        const relations = await inspector.getRelations(tableName, row);
        allRelations.push(...relations);
      } catch (err) {
        console.error(`[InspectorRegistry] Error in inspector ${inspector.name}:`, err);
      }
    }

    return allRelations;
  }

  public async getBadges(tableName: string, row: Record<string, unknown>): Promise<string[]> {
    const allBadges: string[] = [];

    for (const inspector of this.inspectors) {
      if (inspector.getBadges) {
        try {
          const badges = await inspector.getBadges(tableName, row);
          allBadges.push(...badges);
        } catch (err) {
          console.error(`[InspectorRegistry] Error in inspector getBadges ${inspector.name}:`, err);
        }
      }
    }

    return allBadges;
  }
}

export const inspectorRegistry = new InspectorRegistry();
