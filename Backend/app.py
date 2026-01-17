"""
Insight Engine - Flask Backend with Machine Learning
Run with: python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import io
import traceback

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

class DataAnalyzer:
    """Advanced data analysis and ML prediction engine"""
    
    def __init__(self, df):
        self.df = df
        self.numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
        
    def clean_data(self):
        """Clean and prepare data"""
        # Handle missing values
        for col in self.numeric_cols:
            self.df[col].fillna(self.df[col].median(), inplace=True)
        
        for col in self.categorical_cols:
            self.df[col].fillna(self.df[col].mode()[0] if not self.df[col].mode().empty else 'Unknown', inplace=True)
        
        return self.df
    
    def get_summary(self):
        """Generate data summary"""
        missing_count = int(self.df.isnull().sum().sum())
        total_cells = self.df.size
        duplicates = self.df.duplicated().sum()
        
        # Simple Data Quality Score (0-100)
        quality_score = max(0, 100 - (missing_count / total_cells * 100) - (duplicates / len(self.df) * 100 * 2))

        return {
            'total_records': len(self.df),
            'total_columns': len(self.df.columns),
            'numeric_columns': len(self.numeric_cols),
            'categorical_columns': len(self.categorical_cols),
            'missing_values': missing_count,
            'data_quality_score': round(quality_score, 1)
        }
    
    def get_statistics(self):
        """Calculate statistical measures"""
        stats = {}
        
        for col in self.numeric_cols:
            stats[col] = {
                'mean': float(self.df[col].mean()),
                'std': float(self.df[col].std()),
                'min': float(self.df[col].min()),
                'max': float(self.df[col].max()),
                'median': float(self.df[col].median()),
                'q25': float(self.df[col].quantile(0.25)),
                'q75': float(self.df[col].quantile(0.75))
            }
        
        for col in self.categorical_cols:
            stats[col] = {
                'count': int(self.df[col].count()),
                'unique': int(self.df[col].nunique()),
                'top': str(self.df[col].mode()[0]) if not self.df[col].mode().empty else 'N/A',
                'freq': int(self.df[col].value_counts().iloc[0]) if not self.df[col].value_counts().empty else 0
            }
        return stats
    
    def detect_patterns(self):
        """Detect patterns in the data"""
        patterns = []
        
        if len(self.numeric_cols) >= 2:
            # Correlation analysis
            corr_matrix = self.df[self.numeric_cols].corr()
            
            for i in range(len(self.numeric_cols)):
                for j in range(i + 1, len(self.numeric_cols)):
                    corr_value = corr_matrix.iloc[i, j]
                    
                    if abs(corr_value) > 0.7:
                        strength = "Strong positive" if corr_value > 0 else "Strong negative"
                        patterns.append({
                            'type': 'Correlation',
                            'description': f'{strength} correlation between {self.numeric_cols[i]} and {self.numeric_cols[j]}',
                            'value': f'{corr_value:.3f}'
                        })
        
        # Outlier detection
        for col in self.numeric_cols:
            q1 = self.df[col].quantile(0.25)
            q3 = self.df[col].quantile(0.75)
            iqr = q3 - q1
            outliers = ((self.df[col] < (q1 - 1.5 * iqr)) | (self.df[col] > (q3 + 1.5 * iqr))).sum()
            
            if outliers > 0:
                patterns.append({
                    'type': 'Outliers',
                    'description': f'Detected {outliers} outliers in {col}',
                    'value': f'{outliers} records'
                })
        
        # Trend analysis
        for col in self.numeric_cols:
            data_values = self.df[col].values
            if len(data_values) > 10:
                x = np.arange(len(data_values)).reshape(-1, 1)
                y = data_values.reshape(-1, 1)
                
                model = LinearRegression()
                model.fit(x, y)
                slope = model.coef_[0][0]
                
                if abs(slope) > 0.01:
                    trend = "increasing" if slope > 0 else "decreasing"
                    patterns.append({
                        'type': 'Trend',
                        'description': f'{col} shows {trend} trend over time',
                        'value': f'Slope: {slope:.4f}'
                    })
        
        # Distribution insights
        for col in self.numeric_cols:
            skewness = self.df[col].skew()
            if abs(skewness) > 1:
                dist_type = "right-skewed" if skewness > 0 else "left-skewed"
                patterns.append({
                    'type': 'Distribution',
                    'description': f'{col} has a {dist_type} distribution',
                    'value': f'Skewness: {skewness:.3f}'
                })
        
        return patterns if patterns else [{
            'type': 'Info',
            'description': 'No significant patterns detected in the current dataset',
            'value': None
        }]
    
    def predict_trends(self, target_column=None, model_type='linear'):
        """Use ML to predict future trends"""
        if len(self.numeric_cols) < 1:
            return {
                'model_score': 0,
                'mse': 0,
                'future_predictions': [],
                'message': 'No numeric columns available for prediction'
            }
        
        # Determine target column
        target_col = target_column if target_column and target_column in self.numeric_cols else self.numeric_cols[0]
        
        # Remove target from features if we were doing multi-variate, 
        # but for this simple trend demo, we are predicting Target vs Time (Index)
        
        # Create features (time-based index)
        X = np.arange(len(self.df)).reshape(-1, 1)
        y = self.df[target_col].values
        
        # Handle any remaining NaN values
        mask = ~np.isnan(y)
        X = X[mask]
        y = y[mask]
        
        if len(X) < 10:
            return {
                'model_score': 0,
                'mse': 0,
                'future_predictions': [],
                'message': 'Insufficient data for prediction'
            }
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train model
        if model_type == 'forest':
            model = RandomForestRegressor(n_estimators=100, random_state=42)
        else:
            model = LinearRegression()
            
        model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test_scaled)
        score = r2_score(y_test, y_pred)
        mse = mean_squared_error(y_test, y_pred)
        
        # Predict future values
        future_steps = 10
        future_X = np.arange(len(self.df), len(self.df) + future_steps).reshape(-1, 1)
        future_X_scaled = scaler.transform(future_X)
        future_predictions = model.predict(future_X_scaled)
        
        return {
            'model_score': float(score),
            'mse': float(mse),
            'future_predictions': [float(p) for p in future_predictions],
            'target_column': target_col,
            'model_used': 'Random Forest' if model_type == 'forest' else 'Linear Regression'
        }


@app.route('/analyze', methods=['POST'])
def analyze_data():
    """Main endpoint for data analysis"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        
        # Validate file
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'Only CSV files are supported'}), 400
        
        # Read CSV
        try:
            csv_data = file.read().decode('utf-8')
            df = pd.read_csv(io.StringIO(csv_data))
        except Exception as e:
            return jsonify({'error': f'Error reading CSV: {str(e)}'}), 400
        
        # Check if dataframe is empty
        if df.empty:
            return jsonify({'error': 'CSV file is empty'}), 400
        
        # Initialize analyzer
        analyzer = DataAnalyzer(df)
        
        # Clean data
        analyzer.clean_data()
        
        # Get options
        target_col = request.form.get('target_column')
        model_type = request.form.get('model_type', 'linear')

        # Generate analysis results
        results = {
            'summary': analyzer.get_summary(),
            'statistics': analyzer.get_statistics(),
            'patterns': analyzer.detect_patterns(),
            'predictions': analyzer.predict_trends(target_col, model_type)
        }
        
        return jsonify(results), 200
    
    except Exception as e:
        print("Error:", traceback.format_exc())
        return jsonify({'error': f'Analysis failed: {str(e)}'}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Insight Engine API is running'
    }), 200


@app.route('/', methods=['GET'])
def home():
    """Root endpoint"""
    return jsonify({
        'name': 'Insight Engine API',
        'version': '1.0.0',
        'endpoints': {
            '/analyze': 'POST - Upload CSV for analysis',
            '/health': 'GET - Health check'
        }
    }), 200


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    print("🚀 Starting Insight Engine Backend...")
    print(f"📊 Server running on port {port}")
    print("🔗 Ready to accept requests from frontend")
    app.run(debug=False, host='0.0.0.0', port=port)