/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { IInputs, IOutputs } from './generated/ManifestTypes';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import ChartDemoApp from './ChartDemoApp';

export class GRCProcessMappingControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private outputAction: IOutputs = {};
    private lastProcessDatasetOutput: string | undefined;
    private notifyOutputChanged: (() => void) | null = null;
    private root: Root | null = null;
    private context: ComponentFramework.Context<IInputs>;
    private container: HTMLDivElement;

    public init(
        context: ComponentFramework.Context<IInputs>,
        notifyOutputChanged: () => void,
        _state: ComponentFramework.Dictionary,
        container: HTMLDivElement,
    ): void {
        context.mode.trackContainerResize(true);
        this.context = context;
        this.container = container;
        this.root = createRoot(container);
        this.notifyOutputChanged = notifyOutputChanged;
        this.render();
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.context = context;
        this.render();
    }

    public getOutputs(): IOutputs {
        return this.outputAction || {};
    }

    public destroy(): void {
        this.root?.unmount();
        this.root = null;
    }

    private render(): void {
        // Always call notifyOutputChanged to update output property
        const onNodeAction = (Type: string, ID: string, Action: string) => {
            this.outputAction = { ...this.outputAction, Type, ID, Action };
            if (this.notifyOutputChanged) this.notifyOutputChanged();
        };

        // Callback to update ProcessDatasetOutput when flow changes
        const onProcessDatasetChange = (newProcessItems: Record<string, string>[]) => {
            const json = JSON.stringify(newProcessItems ?? []);
            if (this.lastProcessDatasetOutput !== json) {
                this.lastProcessDatasetOutput = json;
                this.outputAction = { ...this.outputAction, ProcessDatasetOutput: json };
                if (this.notifyOutputChanged) this.notifyOutputChanged();
            }
        };

        if (!this.root) return;

        const allocatedWidth = Number(this.context.mode.allocatedWidth);
        const allocatedHeight = Number(this.context.mode.allocatedHeight);
        const width = Number.isFinite(allocatedWidth) && allocatedWidth > 0 ? allocatedWidth : 1000;
        const height = Number.isFinite(allocatedHeight) && allocatedHeight > 0 ? allocatedHeight : 500;

        const controlsDataset = this.context.parameters.ControlsDataset;
        const risksDataset = this.context.parameters.RisksDataset;
        const processDataset = this.context.parameters.ProcessDataset;
        const getDatasetValue = (
            dataset: ComponentFramework.PropertyTypes.DataSet,
            record: ComponentFramework.PropertyHelper.DataSetApi.EntityRecord,
            propertyName: string,
        ): string => {
            const column = dataset?.columns?.find(
                (c) => c.alias?.toLowerCase() === propertyName.toLowerCase() || c.name?.toLowerCase() === propertyName.toLowerCase(),
            );
            const value = column ? record.getValue(column.name) : record.getValue(propertyName);
            return (value as string) || '';
        };

        // Build flat ProcessDataset (array of rows) for marker logic
        let processDatasetFlat: Record<string, string>[] = [];
        if (processDataset && !processDataset.loading && processDataset.sortedRecordIds.length > 0) {
            processDatasetFlat = processDataset.sortedRecordIds.map((id) => {
                const record = processDataset.records[id];
                const row: Record<string, string> = {};
                processDataset.columns.forEach((col) => {
                    row[col.name] = getDatasetValue(processDataset, record, col.name);
                });
                return row;
            });
        }

        let controlItems:
            | { id: string; name: string; description: string; category: string; owner: string; status: string; parentId: string }[]
            | undefined;
        if (controlsDataset && !controlsDataset.loading && controlsDataset.sortedRecordIds.length > 0) {
            controlItems = controlsDataset.sortedRecordIds.map((id) => {
                const record = controlsDataset.records[id];
                return {
                    id: getDatasetValue(controlsDataset, record, 'ControlID') || record.getRecordId(),
                    name: getDatasetValue(controlsDataset, record, 'ControlName'),
                    description: getDatasetValue(controlsDataset, record, 'ControlDesc'),
                    category: getDatasetValue(controlsDataset, record, 'ControlCategory'),
                    owner: getDatasetValue(controlsDataset, record, 'ControlOwner'),
                    status: getDatasetValue(controlsDataset, record, 'ControlStatus'),
                    parentId: getDatasetValue(controlsDataset, record, 'RiskID'),
                };
            });
        }

        let riskItems:
            | {
                  id: string;
                  name: string;
                  description: string;
                  parentId: string;
              }[]
            | undefined;
        if (risksDataset && !risksDataset.loading && risksDataset.sortedRecordIds.length > 0) {
            riskItems = risksDataset.sortedRecordIds.map((id) => {
                const record = risksDataset.records[id];
                return {
                    id: getDatasetValue(risksDataset, record, 'RiskID') || record.getRecordId(),
                    name: getDatasetValue(risksDataset, record, 'RiskName'),
                    description: getDatasetValue(risksDataset, record, 'RiskDesc'),
                    parentId: getDatasetValue(risksDataset, record, 'ProcessID'),
                };
            });
        }

        let processItems:
            | {
                  id: string;
                  title: string;
                  department: string;
                  owner: string;
                  risks: {
                      RiskID: string;
                      ProcessRiskStatus: string;
                      RiskObject?: {
                          RiskShortName: string;
                          Description: string;
                          Likelihood: string;
                          Impact: string;
                          RiskStatus: string;
                      };
                      Controls: {
                          ControlID: string;
                          RiskControlStatus: string;
                          ControlName: string;
                          ControlDesc: string;
                          ControlCategory: string;
                          ControlOwner: string;
                          ControlStatus: string;
                      }[];
                  }[];
              }[]
            | undefined;
        if (processDataset && !processDataset.loading && processDataset.sortedRecordIds.length > 0) {
            // Each row = 1 Process → Risk → Control relationship (flat)
            // Group by CoreProcessID → RiskID to build nested structure
            const processMap: Record<string, {
                id: string;
                title: string;
                department: string;
                owner: string;
                HeraclesProcessActivityID: string;
                Index: string;
                ProcessStatus: string;
                risks: Record<string, {
                    RiskID: string;
                    ProcessRiskStatus: string;
                    RiskObject: { RiskShortName: string; Description: string; Likelihood: string; Impact: string; RiskStatus: string };
                    Controls: { ControlID: string; RiskControlStatus: string; ControlName: string; ControlDesc: string; ControlCategory: string; ControlOwner: string; ControlStatus: string }[];
                }>;
            }> = {};

            processDataset.sortedRecordIds.forEach((id) => {
                const record = processDataset.records[id];
                const processId = getDatasetValue(processDataset, record, 'CoreProcessID') || record.getRecordId();
                const riskId = getDatasetValue(processDataset, record, 'RiskID');
                const controlId = getDatasetValue(processDataset, record, 'ControlID');

                // Upsert process
                if (!processMap[processId]) {
                    processMap[processId] = {
                        id: processId,
                        title: getDatasetValue(processDataset, record, 'ProcessActivityName'),
                        department: getDatasetValue(processDataset, record, 'DepartmentName'),
                        owner: getDatasetValue(processDataset, record, 'Owner'),
                        HeraclesProcessActivityID: getDatasetValue(processDataset, record, 'HeraclesProcessActivityID'),
                        Index: getDatasetValue(processDataset, record, 'Index'),
                        ProcessStatus: getDatasetValue(processDataset, record, 'ProcessStatus'),
                        risks: {},
                    };
                }

                if (!riskId) return;

                // Upsert risk under process
                if (!processMap[processId].risks[riskId]) {
                    processMap[processId].risks[riskId] = {
                        RiskID: riskId,
                        ProcessRiskStatus: getDatasetValue(processDataset, record, 'ProcessRiskStatus'),
                        RiskObject: {
                            RiskShortName: getDatasetValue(processDataset, record, 'RiskShortName'),
                            Description: getDatasetValue(processDataset, record, 'RiskDescription'),
                            Likelihood: getDatasetValue(processDataset, record, 'RiskLikelihood'),
                            Impact: getDatasetValue(processDataset, record, 'RiskImpact'),
                            RiskStatus: getDatasetValue(processDataset, record, 'RiskStatus'),
                        },
                        Controls: [],
                    };
                }

                // Append control under risk (if exists and not duplicate)
                if (controlId) {
                    const existingControl = processMap[processId].risks[riskId].Controls.find(c => c.ControlID === controlId);
                    if (!existingControl) {
                        processMap[processId].risks[riskId].Controls.push({
                            ControlID: controlId,
                            RiskControlStatus: getDatasetValue(processDataset, record, 'RiskControlStatus'),
                            ControlName: getDatasetValue(processDataset, record, 'ControlName'),
                            ControlDesc: getDatasetValue(processDataset, record, 'ControlDesc'),
                            ControlCategory: getDatasetValue(processDataset, record, 'ControlCategory'),
                            ControlOwner: getDatasetValue(processDataset, record, 'ControlOwner'),
                            ControlStatus: getDatasetValue(processDataset, record, 'ControlStatus'),
                        });
                    }
                }
            });

            processItems = Object.values(processMap).map((p) => ({
                ...p,
                risks: Object.values(p.risks),
            }));
        }

        // Set initial ProcessDatasetOutput on first render/init
        if (processItems && !this.lastProcessDatasetOutput) {
            const json = JSON.stringify(processItems);
            this.lastProcessDatasetOutput = json;
            this.outputAction = { ...this.outputAction, ProcessDatasetOutput: json };
            if (this.notifyOutputChanged) this.notifyOutputChanged();
        }

        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.position = 'relative';
        this.container.style.display = 'block';

        this.root.render(
            React.createElement(
                'div',
                {
                    style: {
                        width: `${width}px`,
                        height: `${height}px`,
                        overflow: 'hidden',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                    },
                },
                React.createElement(ChartDemoApp, { processItems, controlItems, riskItems, processDatasetFlat, onNodeAction, onProcessDatasetChange }),
            ),
        );
    }
}
