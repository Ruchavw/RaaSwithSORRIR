# RaaSwithSORRIR
## Directory Structure
```sh
raas-mvp/
│
├── README.md
├── requirements.txt
├── docker-compose.yml
├── .env
├── run.sh
│
├── config/
│   └── settings.yaml
│
├── data/
│   ├── logs/
│   ├── inputs/
│   └── outputs/
│
├── models/
│   ├── isolation_forest.py
│   └── utils.py
│
├── recovery/
│   ├── auto_recovery.py
│   ├── reroute_engine.py
│   └── backup_policies.yaml
│
├── dashboard/
│   ├── app.py
│   ├── templates/
│   └── static/
│
├── policy_engine/
│   ├── engine.py
│   ├── policies.yaml
│   └── policy_utils.py
│
├── cloud/
│   ├── api_gateway/
│   ├── edge_connector/
│   ├── deploy/
│   └── cloud_core.py
│
├── containerization/
│   ├── Dockerfile
│   ├── docker-compose.override.yml
│   └── scripts/
│
├── api/
│   ├── app.py
│   ├── routes/
│   └── schemas/
│
├── middleware/
│   ├── sorrir_core/
│   │   ├── __init__.py
│   │   ├── architecture_config.json    
│   │   ├── event_definitions.py         
│   │   ├── recovery_behaviors.py       
│   │   └── component_registry.py     
│   ├── integrations/
│   │   ├── detector_adapter.py        
│   │   └── policy_adapter.py        
│   └── orchestrator.py              
│
└── docs/
    ├── architecture_diagram.png
    ├── sorrir_workflow.md
    └── mvp_summary.md
```
