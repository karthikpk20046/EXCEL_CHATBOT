import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from openai import OpenAI
import re
import numpy as np
# Add this at the top with other imports
from datetime import datetime

# In analyze_with_gpt(), modify the prompt for better responses:
prompt = f"""
You are an expert data analyst assistant. Analyze this dataset with {len(df)} rows:

Columns: {', '.join(df.columns)}
Sample data: {df.head(3).to_string()}

User question: "{query}"

Provide:
1. Concise answer with exact numbers
2. Recommended visualization type
3. Key insights (trends/outliers)
"""

# Set page config
st.set_page_config(page_title="Excel Chatbot", page_icon="📊", layout="wide")

# Initialize OpenAI client
client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])

# Custom CSS for better UI
st.markdown("""
    <style>
    .main {padding: 2rem;}
    .stButton>button {width: 100%;}
    .stDownloadButton>button {width: 100%;}
    .reportview-container .main .block-container {padding-top: 2rem;}
    h1 {color: #2a3f5f;}
    </style>
    """, unsafe_allow_html=True)

def preprocess_data(df):
    """Preprocess the dataframe to handle common issues"""
    try:
        # Normalize column names
        df.columns = [re.sub(r'[^a-zA-Z0-9]', '_', str(col).lower().strip()) for col in df.columns]
        
        # Convert date columns
        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    df[col] = pd.to_datetime(df[col])
                except:
                    pass
        
        # Handle missing values
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col].fillna('Unknown', inplace=True)
            elif pd.api.types.is_numeric_dtype(df[col]):
                df[col].fillna(df[col].median(), inplace=True)
                
        return df
    except Exception as e:
        st.error(f"Error during data preprocessing: {str(e)}")
        return None

def generate_visualization(df, query, x_col=None, y_col=None):
    """Generate appropriate visualization based on query"""
    try:
        plt.figure(figsize=(10, 6))
        
        # Determine visualization type based on query
        if "trend" in query.lower() or "over time" in query.lower():
            # Find date column for trend analysis
            date_cols = [col for col in df.columns if pd.api.types.is_datetime64_any_dtype(df[col])]
            num_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
            
            if date_cols and num_cols:
                plt.title(f"Trend of {num_cols[0]} over time")
                sns.lineplot(data=df, x=date_cols[0], y=num_cols[0])
                st.pyplot(plt)
                return f"Showing trend of {num_cols[0]} over time"
        
        elif "distribution" in query.lower() or "histogram" in query.lower():
            num_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
            if num_cols:
                plt.title(f"Distribution of {num_cols[0]}")
                sns.histplot(data=df, x=num_cols[0], kde=True)
                st.pyplot(plt)
                return f"Showing distribution of {num_cols[0]}"
        
        elif "compare" in query.lower() or "by" in query.lower():
            # Try to find categorical and numerical columns for comparison
            cat_cols = [col for col in df.columns if df[col].nunique() < 20 and not pd.api.types.is_numeric_dtype(df[col])]
            num_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
            
            if cat_cols and num_cols:
                plt.title(f"Comparison of {num_cols[0]} by {cat_cols[0]}")
                sns.barplot(data=df, x=cat_cols[0], y=num_cols[0])
                plt.xticks(rotation=45)
                st.pyplot(plt)
                return f"Showing comparison of {num_cols[0]} by {cat_cols[0]}"
        
        # Default to showing first few rows if no specific visualization is triggered
        st.write("Here are the first few rows of your data:")
        st.dataframe(df.head())
        return "Displaying sample data rows"
    
    except Exception as e:
        st.error(f"Error generating visualization: {str(e)}")
        return None

def analyze_with_gpt(df, query):
    """Use OpenAI to analyze the data and answer the query"""
    try:
        # Create a text description of the dataframe
        data_description = f"""
        The dataset contains {len(df)} rows and {len(df.columns)} columns.
        Columns and their data types:
        {df.dtypes.to_string()}
        
        Sample data:
        {df.head().to_string()}
        """
        
        prompt = f"""
        You are a data analysis assistant. The user has uploaded a dataset with the following characteristics:
        {data_description}
        
        The user asked: "{query}"
        
        Please provide a concise, accurate answer based on the data. If the question requires calculations, 
        include the specific numbers. If it suggests a visualization, mention what type would be appropriate.
        """
        
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful data analysis assistant."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content
    except Exception as e:
        return f"Error analyzing data: {str(e)}"

def main():
    st.title("📊 Excel Data Chatbot")
    st.markdown("Upload an Excel file and ask questions about your data in natural language.")
    
    # File upload section
    uploaded_file = st.file_uploader("Upload Excel File", type=["xlsx", "xls"])
    
    if uploaded_file is not None:
        try:
            # Read and preprocess data
            df = pd.read_excel(uploaded_file)
            df = preprocess_data(df)
            
            if df is not None:
                st.success("Data successfully loaded!")
                
                # Show basic data info
                with st.expander("Show Data Summary"):
                    st.write(f"**Shape:** {df.shape[0]} rows, {df.shape[1]} columns")
                    st.write("**Columns:**", list(df.columns))
                    st.write("**Preview:**")
                    st.dataframe(df.head())
                
                # Chat interface
                st.subheader("Ask Questions About Your Data")
                query = st.text_input("Enter your question (e.g., 'What is the average income?', 'Show sales trend over time')")
                
                if query:
                    with st.spinner("Analyzing your data..."):
                        # Get analysis from GPT
                        analysis_result = analyze_with_gpt(df, query)
                        
                        # Display analysis
                        st.markdown("### Analysis Result")
                        st.write(analysis_result)
                        
                        # Generate visualization
                        viz_result = generate_visualization(df, query)
                        
            else:
                st.error("Failed to process the uploaded file.")
                
        except Exception as e:
            st.error(f"Error processing file: {str(e)}")
    
    # Add sample questions
    with st.expander("💡 Sample Questions to Try"):
        st.markdown("""
        - What are the summary statistics for numerical columns?
        - Show the distribution of [numeric column]
        - What is the average [numeric column]?
        - Compare [numeric column] by [categorical column]
        - Show trend of [numeric column] over time (if date column exists)
        - How many records have [condition]?
        """)

if __name__ == "__main__":
    main()
