"""Dataset validation utility for checking dataset integrity."""

import pandas as pd
import logging
from pathlib import Path
from app.core.config import DATASET_DIR

logger = logging.getLogger(__name__)


class DatasetValidator:
    """Validates and checks dataset integrity."""
    
    REQUIRED_DATASETS = {
        "skills_en.csv": ["conceptUri", "preferredLabel"],
        "occupations_en.csv": ["conceptUri", "preferredLabel"],
        "occupationSkillRelations_en.csv": ["occupationUri", "skillUri"]
    }
    
    @staticmethod
    def validate_all():
        """Validate all required datasets."""
        all_valid = True
        
        for dataset_name, required_cols in DatasetValidator.REQUIRED_DATASETS.items():
            if not DatasetValidator.validate_dataset(dataset_name, required_cols):
                all_valid = False
        
        return all_valid
    
    @staticmethod
    def validate_dataset(dataset_name, required_columns=None):
        """
        Validate a single dataset.
        
        Args:
            dataset_name: Name of the dataset file
            required_columns: List of required column names
            
        Returns:
            True if valid, False otherwise
        """
        dataset_path = DATASET_DIR / dataset_name
        
        # Check file existence
        if not dataset_path.exists():
            logger.error(f"Dataset file not found: {dataset_path}")
            return False
        
        try:
            # Try to load the dataset
            df = pd.read_csv(dataset_path)
            
            # Check row count
            if len(df) == 0:
                logger.error(f"Dataset is empty: {dataset_name}")
                return False
            
            # Validate required columns
            if required_columns:
                missing_cols = [col for col in required_columns if col not in df.columns]
                if missing_cols:
                    logger.error(f"Dataset {dataset_name} missing columns: {missing_cols}")
                    return False
            
            # Check for missing values in required columns
            if required_columns:
                for col in required_columns:
                    missing_count = df[col].isna().sum()
                    if missing_count > 0:
                        logger.warning(f"Dataset {dataset_name} has {missing_count} missing values in '{col}'")
            
            logger.info(f"Dataset validation passed: {dataset_name} ({len(df)} rows)")
            return True
        
        except Exception as e:
            logger.error(f"Error validating dataset {dataset_name}: {e}")
            return False
    
    @staticmethod
    def get_dataset_stats():
        """Get statistics about all datasets."""
        stats = {}
        
        for dataset_name in DatasetValidator.REQUIRED_DATASETS.keys():
            dataset_path = DATASET_DIR / dataset_name
            
            try:
                if dataset_path.exists():
                    df = pd.read_csv(dataset_path)
                    size_mb = dataset_path.stat().st_size / (1024 * 1024)
                    stats[dataset_name] = {
                        "rows": len(df),
                        "columns": len(df.columns),
                        "size_mb": round(size_mb, 2),
                        "status": "valid"
                    }
                else:
                    stats[dataset_name] = {"status": "missing"}
            except Exception as e:
                stats[dataset_name] = {"status": "error", "error": str(e)}
        
        return stats
