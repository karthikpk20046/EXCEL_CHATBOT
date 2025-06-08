import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from openai import OpenAI
import re
import numpy as np
from datetime import datetime

# Set Streamlit page config
st.set_page_config(page_title="Excel Chatbot", page_icon="📊", layout="wide")

# Initialize OpenAI client
client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])

# Custom CSS for better UI
st.markdown("""
    <style>
    .stTextInput>div>div>input {
        border: 2px solid #2a3f5f;
        border-radius: 8px;
        padding: 10px;
        font-size: 16px;
    }
    </style>
""", unsafe_allow_html=True)

# Preprocessing function
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

# Visualization generation
def generate_visualization(df, query):
    """Generate appropriate visualization based on query content and data types"""
    try:
        fig, ax = plt.subplots(figsize=(12, 6))

        num_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
        date_cols = [col for col in df.columns if pd.api.types.is_datetime64_any_dtype(df[col])]
        cat_cols = [
            col for col in df.columns 
            if not pd.api.types.is_numeric_dtype(df[col]) 
            and df[col].nunique() < min(20, len(df)//2)
        ]

        if any(word in query.lower() for word in ["trend", "time", "over time", "month", "year"]) and date_cols:
            y_col = num_cols[0] if num_cols else None
            if y_col:
                sns.lineplot(data=df, x=date_cols[0], y=y_col, ax=ax)
                ax.set_title(f"Trend of {y_col} over time", pad=20)
                ax.set_xlabel("")
                plt.xticks(rotation=45)

        elif any(word in query.lower() for word in ["distribut", "histogram", "frequency", "spread"]):
            if num_cols:
                sns.histplot(df[num_cols[0]], kde=True, ax=ax, bins='auto')
                ax.set_title(f"Distribution of {num_cols[0]}", pad=20)
                ax.set_xlabel(num_cols[0])

        elif any(word in query.lower() for word in ["compare", "by", "versus", "vs", "across"]):
            if cat_cols and num_cols:
                cat_col = next((col for col in cat_cols if col in query.lower()), cat_cols[0])
                sns.barplot(data=df, x=cat_col, y=num_cols[0], ax=ax, estimator=np.mean)
                ax.set_title(f"Average {num_cols[0]} by {cat_col}", pad=20)
                plt.xticks(rotation=45)
                ax.set_xlabel("")

        else:
            st.markdown("### Statistical Summary")
            st.dataframe(df.describe(include='all').style.format("{:.2f}"))
            return ""

        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
        return ""

    except Exception as e:
        st.error(f"Couldn't generate visualization: {str(e)}")
        return None

# GPT analysis
def analyze_with_gpt(df, query):
    """Use OpenAI to analyze the data and answer the query"""
    try:
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

# Main app logic
def main():
    st.title("📊 Excel Data Chatbot")
    st.markdown("Upload an Excel file and ask questions about your data in natural language.")

    # File uploader
    uploaded_file = st.file_uploader("Upload Excel File", type=["xlsx", "xls"])

    if uploaded_file is not None:
        try:
            df = pd.read_excel(uploaded_file)
            df = preprocess_data(df)

            if df is not None:
                st.success("Data successfully loaded!")

                with st.expander("Show Data Summary"):
                    st.write(f"**Shape:** {df.shape[0]} rows, {df.shape[1]} columns")
                    st.write("**Columns:**", list(df.columns))
                    st.write("**Preview:**")
                    st.dataframe(df.head())

                st.markdown("""
    <label for="custom_id">Custom Field:</label>
    <input type="text" id="custom_id" name="custom_field">
""", unsafe_allow_html=True)

                # Question input
                st.subheader("Ask Questions About Your Data")
                query = st.text_input("Enter your question (e.g., 'What is the average income?', 'Show sales trend over time')")

                if query:
                    with st.spinner("Analyzing your data..."):
                        analysis_result = analyze_with_gpt(df, query)
                        st.markdown("### Analysis Result")
                        st.write(analysis_result)

                        generate_visualization(df, query)
            else:
                st.error("Failed to process the uploaded file.")

        except Exception as e:
            st.error(f"Error processing file: {str(e)}")

    # Sample help
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
