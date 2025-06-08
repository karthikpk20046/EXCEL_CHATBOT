import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import re
import numpy as np
from datetime import datetime

# Set Streamlit page config
st.set_page_config(page_title="Excel Chatbot (Free)", page_icon="📊", layout="wide")

# Preprocessing function
def preprocess_data(df):
    try:
        df.columns = [re.sub(r'[^a-zA-Z0-9]', '_', str(col).lower().strip()) for col in df.columns]

        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    df[col] = pd.to_datetime(df[col])
                except:
                    pass

        for col in df.columns:
            if df[col].dtype == 'object':
                df[col].fillna('Unknown', inplace=True)
            elif pd.api.types.is_numeric_dtype(df[col]):
                df[col].fillna(df[col].median(), inplace=True)

        return df
    except Exception as e:
        st.error(f"Error during data preprocessing: {str(e)}")
        return None

# Simple rule-based analysis (replaces GPT)
def analyze_data_simple(df, query):
    query = query.lower()
    try:
        if "average" in query or "mean" in query:
            for col in df.select_dtypes(include='number').columns:
                if col in query:
                    return f"Average of `{col}`: {df[col].mean():.2f}"

        elif "summary" in query or "statistics" in query:
            return df.describe(include='all').to_string()

        elif "columns" in query:
            return f"Columns: {', '.join(df.columns)}"

        elif "count" in query or "number of records" in query:
            return f"Total number of rows: {len(df)}"

        else:
            return "This version supports basic analysis like average, summary, column list, and row count."
    except Exception as e:
        return f"Error analyzing data: {str(e)}"

# Visualization generation
def generate_visualization(df, query):
    try:
        fig, ax = plt.subplots(figsize=(12, 6))

        num_cols = [col for col in df.columns if pd.api.types.is_numeric_dtype(df[col])]
        date_cols = [col for col in df.columns if pd.api.types.is_datetime64_any_dtype(df[col])]
        cat_cols = [
            col for col in df.columns 
            if not pd.api.types.is_numeric_dtype(df[col]) 
            and df[col].nunique() < min(20, len(df)//2)
        ]

        query = query.lower()

        if any(word in query for word in ["trend", "time", "over time", "month", "year"]) and date_cols:
            y_col = num_cols[0] if num_cols else None
            if y_col:
                sns.lineplot(data=df, x=date_cols[0], y=y_col, ax=ax)
                ax.set_title(f"Trend of {y_col} over time", pad=20)
                plt.xticks(rotation=45)

        elif any(word in query for word in ["distribution", "histogram", "frequency", "spread"]) and num_cols:
            sns.histplot(df[num_cols[0]], kde=True, ax=ax, bins='auto')
            ax.set_title(f"Distribution of {num_cols[0]}", pad=20)

        elif any(word in query for word in ["compare", "by", "versus", "vs", "across"]) and cat_cols and num_cols:
            cat_col = cat_cols[0]
            sns.barplot(data=df, x=cat_col, y=num_cols[0], ax=ax, estimator=np.mean)
            ax.set_title(f"Average {num_cols[0]} by {cat_col}", pad=20)
            plt.xticks(rotation=45)

        else:
            st.markdown("### Statistical Summary")
            st.dataframe(df.describe(include='all').style)
            return ""

        plt.tight_layout()
        st.pyplot(fig)
        plt.close()
        return ""
    except Exception as e:
        st.error(f"Couldn't generate visualization: {str(e)}")
        return None

# Main app
def main():
    st.title("📊 Excel Chatbot (Free Version)")
    st.markdown("Upload an Excel file and ask basic questions about your data. (No OpenAI API needed!)")

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
                    st.dataframe(df.head())

                st.subheader("Ask Questions About Your Data")
                query = st.text_input("Enter your question (e.g., 'What is the average income?', 'Show sales trend over time')")

                if query:
                    with st.spinner("Analyzing your data..."):
                        result = analyze_data_simple(df, query)
                        st.markdown("### Analysis Result")
                        st.text(result)

                        generate_visualization(df, query)
            else:
                st.error("Failed to process the uploaded file.")
        except Exception as e:
            st.error(f"Error processing file: {str(e)}")

    with st.expander("💡 Sample Questions to Try"):
        st.markdown("""
        - What are the summary statistics for numerical columns?
        - What is the average [numeric column]?
        - How many records are there?
        - Show the distribution of [numeric column]
        - Compare [numeric column] by [categorical column]
        - Show trend of [numeric column] over time
        """)

if __name__ == "__main__":
    main()
